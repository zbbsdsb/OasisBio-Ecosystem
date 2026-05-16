import SwiftUI

struct VirtualList<Data: RandomAccessCollection, Content: View>: View where Data.Element: Identifiable {
    let data: Data
    let spacing: CGFloat
    let idKeyPath: KeyPath<Data.Element, Data.Element.ID>
    let content: (Data.Element) -> Content

    @State private var contentHeight: CGFloat = 0
    @State private var scrollOffset: CGFloat = 0

    init(
        _ data: Data,
        spacing: CGFloat = 0,
        id idKeyPath: KeyPath<Data.Element, Data.Element.ID> = \.id,
        @ViewBuilder content: @escaping (Data.Element) -> Content
    ) {
        self.data = data
        self.spacing = spacing
        self.idKeyPath = idKeyPath
        self.content = content
    }

    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                LazyVStack(spacing: spacing) {
                    ForEach(data, id: idKeyPath) { item in
                        content(item)
                            .id(item[keyPath: idKeyPath])
                    }
                }
                .background(
                    GeometryReader { contentGeometry in
                        Color.clear.preference(
                            key: ContentHeightPreferenceKey.self,
                            value: contentGeometry.size.height
                        )
                    }
                )
            }
            .onPreferenceChange(ContentHeightPreferenceKey.self) { height in
                contentHeight = height
            }
        }
    }
}

struct VirtualListH<Data: RandomAccessCollection, Content: View>: View where Data.Element: Identifiable {
    let data: Data
    let spacing: CGFloat
    let idKeyPath: KeyPath<Data.Element, Data.Element.ID>
    let content: (Data.Element) -> Content

    init(
        _ data: Data,
        spacing: CGFloat = 0,
        id idKeyPath: KeyPath<Data.Element, Data.Element.ID> = \.id,
        @ViewBuilder content: @escaping (Data.Element) -> Content
    ) {
        self.data = data
        self.spacing = spacing
        self.idKeyPath = idKeyPath
        self.content = content
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            LazyHStack(spacing: spacing) {
                ForEach(data, id: idKeyPath) { item in
                    content(item)
                        .id(item[keyPath: idKeyPath])
                }
            }
        }
    }
}

private struct ContentHeightPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

@available(iOS 17.0, *)
struct OptimizedList<Data: RandomAccessCollection, Content: View>: View where Data.Element: Identifiable {
    let data: Data
    let spacing: CGFloat
    let idKeyPath: KeyPath<Data.Element, Data.Element.ID>
    @ViewBuilder let content: (Data.Element) -> Content

    init(
        _ data: Data,
        spacing: CGFloat = 0,
        id idKeyPath: KeyPath<Data.Element, Data.Element.ID> = \.id,
        @ViewBuilder content: @escaping (Data.Element) -> Content
    ) {
        self.data = data
        self.spacing = spacing
        self.idKeyPath = idKeyPath
        self.content = content
    }

    var body: some View {
        ScrollView {
            LazyVStack(spacing: spacing) {
                ForEach(data, id: idKeyPath) { item in
                    content(item)
                        .equatable()
                }
            }
        }
    }
}

struct ListItemID: Hashable {
    let id: AnyHashable
    let contentHash: Int

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
        hasher.combine(contentHash)
    }

    static func == (lhs: ListItemID, rhs: ListItemID) -> Bool {
        lhs.id == rhs.id && lhs.contentHash == rhs.contentHash
    }
}
