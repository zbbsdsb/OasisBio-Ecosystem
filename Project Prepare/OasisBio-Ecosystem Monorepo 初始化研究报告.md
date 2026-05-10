# OasisBio-Ecosystem Monorepo 初始化研究报告

## 1. 背景与目标  
OasisBio 项目定位为一个跨时代、多身份形态的数字身份系统，原有 **OasisBio** 仓库是该项目的主仓，包含协议、后端、Web 前端和文档等内容【25†L449-L457】【31†L296-L300】。现计划建立一个新的 **OasisBio-Ecosystem** 仓库，用于承载客户端（Android、iOS、Web、桌面）、SDK、集成示例、开发者文档等生态相关内容。此报告旨在分析已有决策、验证对项目的理解，研究原仓库代码结构和新仓库现状，设计可执行、低复杂度的多端单仓库（Monorepo）架构，并制定 Android 第一阶段的技术方案和初始化步骤，最终为后续 AI Coding Agent 的项目启动提供具体指导。

## 2. 对话附件中的既定决策  
根据此前与团队的讨论，已经形成以下关键决策和方向（结合原仓库实际情况进行补充说明）：

- **原仓库不适合直接开发 Android：** 原 **OasisBio** 仓库是一个基于 Next.js 的全栈 Web 应用【25†L395-L403】【25†L449-L457】，已集成前端组件和后端 API，直接在此仓库引入 Android 代码会混淆技术栈和架构（Next.js/TypeScript 与原生 Android 完全不同），且不利于版本管理和模块化。因此决定不在原仓库中开发 Android 应用。【25†L395-L403】  
- **不以 Fork 原仓库为新项目主线：** 虽然原仓库技术上可以 Fork，但 Fork 仍然和原仓库紧耦合，不适合作为新生态仓库的主线。新的生态仓库需要独立演进，并且保留原仓库作为协议/后端的参考，但不将其代码作为主开发线。日后若需向原仓库提交修复或功能，应通过正常的仓库间协作流程（PR 等）进行。  
- **不局限于 “mobile” 或 “clients”：** 项目最初讨论过仅做一个移动客户端或多个客户端合集，但团队认识到 OasisBio 的核心是一个完整的身份体系和协议【31†L296-L300】，涉及诸如真实身份、虚构身份、混合身份等多种身份模式【31†L348-L352】，还有能力池、世界观、3D 模型等丰富功能。因此决定不将仓库定位为单一移动端或客户端项目，而是扩大范围，为生态系统提供支撑。  
- **新仓库定位为 OasisBio-Ecosystem：** 这一命名表明仓库将包含整个 OasisBio 生态的各个组成部分：Android App（优先实现）、iOS App、Web/PWA、桌面应用、SDK、API 客户端、设计系统、开发者工具、接口文档、产品与生态路线图等。这个定位既表明了仓库的全面性，也强调了未来可能的扩展方向。  
- **Android 优先落地，但非仓库边界：** 团队明确将 Android 作为第一阶段的优先目标，以尽快交付移动端应用；但同时强调仓库边界不能只限于 Android。即使初期实现重心在 Android，目录结构和仓库管理也必须为后续引入 iOS、Web 等做好准备。  
- **初期避免过度设计：** 鉴于仓库定位虽大，但首阶段重点聚焦Android，避免引入过多复杂技术选型，如一开始就使用多端共享框架（KMP、React Native、Flutter）、Monorepo 工具（Turborepo、pnpm workspace）等。决策上倾向于低复杂度、可执行、可扩展的方案，只实现刚需功能，留出演进余地。  
- **第一阶段不使用 Git Submodule：** 原仓库可以通过 Git Submodule 引入，但这样会增加操作复杂度（子模块更新、版本同步等）。鉴于初期只需要参考原仓库的 API 和模型代码，不需要与之保持同步开发，故暂不使用子模块。未来若需要将原仓库的某些代码整合为依赖，可在 `external/` 目录下手动添加，而不是正式使用子模块。  
- **第一阶段不引入 Kotlin Multiplatform (KMP)：** KMP 可以让 Android 和 iOS 共享代码，但引入门槛高，开发效率下降。当前团队倾向 Android 原生开发，以保证用户体验，不希望因为“跨端统一”而牺牲原生体验。暂时不使用 KMP，未来若团队同时开发 iOS 时，再评估将哪些数据模型或业务逻辑迁移到 KMP 模块。  
- **第一阶段不采用 Turborepo/pnpm workspace：** 这些工具适用于大型前端/全栈 Monorepo 管理，对于当前仅有 Android 应用的仓库来说过于复杂。暂时不配置，多端 (Web、文档站、Node 包等) 增多时，再考虑引入合适的 Monorepo 工具。  
- **仍需通过原仓库进一步确认的问题：** 许多架构细节需要在原仓库实际内容中确认，例如当前已有哪些 API 路由和数据库模型（见下文【36†L639-L647】【71†L1184-L1192】），验证当前认证方案（Supabase、OAuth、RLS）、文件存储等能力，确保移动端所需接口和数据结构清晰。  

以上决策可归纳为：**已确定的方向**包括将新仓库定位为跨平台生态系统并以 Android 为首批实现、初期保持架构简单避免过度设计等；**待验证的假设**主要涉及原仓库的实际 API/数据定义和认证细节；**基于仓库内容的新判断**则是在阅读原项目后，对部署方案（如使用 Cloudflare R2、Supabase 等）及核心模型的理解。  

## 3. 对 OasisBio 项目的理解校验  
请见用户提供的理解要点，对照原仓库内容进行核实：

1. **“OasisBio 不是一个普通后端项目。”** 从实际内容看，原仓库既有前端（Next.js App、UI 组件）也有后端（API 路由、数据库 schema）【25†L449-L457】。它同时包含了数据库模型 (Prisma)、服务逻辑、界面、文档等，因此确实不是仅后端。  
2. **“OasisBio 不是简单的‘生物信息 App’。”** 原项目名虽含“Bio”，但它实现的是一种角色/身份管理系统（创建角色、世界观、能力池等），而非学术上的生物信息应用【19†L451-L459】【31†L296-L300】。例如，`src/app/dashboard/oasisbios/` 的注释显示这是“角色管理”功能【19†L451-L459】，说明其核心是虚拟身份而非传统生物信息。  
3. **“OasisBio 更像是一个数字身份协议/身份基础设施项目。”** 原仓库技术文档明言它是跨时代（Trans-Era）的身份系统【31†L296-L300】，允许用户在不同时间和世界观中创建、管理多重身份。此描述符合协议/基础设施的定位。  
4. **“核心方向围绕跨时代、跨世界、跨身份形态的数字身份系统。”** 项目概览确实提到“跨时代身份系统（cross-era identity system）”和“不同时间段、虚构世界的多重身份”【31†L296-L300】。后续各文档细节中，还专门谈到身份模式（真实/虚构/未来/平行等）【31†L348-L352】、世界观构建等，佐证了这一理解。  
5. **“涉及真实身份、虚构角色、混合身份、未来/平行世界身份等。”** 官方文档明确列出了“身份模式（real, fictional, hybrid, future, alternate）”等多种身份类型【31†L348-L352】，验证了不仅限于现实世界身份。  
6. **“不是简单的角色创建器，而是更完整的身份基础设施。”** 从功能看，系统支持身份的完整生命周期管理：不仅创建角色，还支持定义时代、能力、上传资料库、3D 模型、发布等过程【25†L450-L459】【25†L512-L520】。这超出了单纯“角色创建器”，更接近完整平台。  
7. **“原 OasisBio 仓库包含协议、本体、Web 产品、后端 API 和相关文档。”** 代码结构中既有前端页面 (`src/app`)、后端 API (`src/app/api`)、Prisma 数据库模式、种子脚本，还有独立的 `docs/` 文档文件夹【25†L449-L457】【31†L294-L302】。因此，原仓库确实集成了协议层（数据模型）、Web 应用、API 和文档。  
8. **“新的 OasisBio-Ecosystem 仓库应承载客户端、SDK、集成示例、开发者工具、生态文档等。”** 这是项目设计需求，此处为理解指导，不直接体现在原仓库代码中。原仓库主要关注协议和 Web 应用，并无这些内容，但我们的定位为生态仓库，正是为了补充这一块。  
9. **“Android 是第一阶段实际落地目标。”** 虽不是代码信息，但已由团队明确。原仓库中未包含移动端实现，表明确实需新仓启动 Android 客户端。  
10. **“后续可能扩展到 iOS、Web、Desktop、SDK、开发者工具、第三方集成示例等。”** 原仓库已有 Web 端实现【25†L449-L457】（基于 Next.js），此处说的是后续生态扩展，与现有内容并不矛盾。移动端、桌面端等尚未开发。该理解符合项目宏观规划。  

综上，**前 1-7 点的理解与原仓库情况高度吻合**【19†L451-L459】【25†L395-L403】【31†L296-L300】；而关于第 8-10 点，则是基于项目规划的设想，原仓库并未体现，但它们也不冲突于现有内容，只是未在原项目中实现。无论如何，此理解基本准确。

## 4. 原 OasisBio 仓库分析  
深入查看原仓库内容后，得到以下发现（列出关键文件和路径）：

- **技术栈：** 原项目采用 **Next.js 14.1.4**（React 18, TS, TailwindCSS）作为前端框架【25†L395-L403】；后端采用 **Node.js** 与 Next.js API 路由【25†L395-L403】；数据库使用 **PostgreSQL（Supabase）** + **Prisma ORM**【25†L395-L403】；3D 渲染用 **Three.js**；认证则集成 **Supabase Auth (OTP)**；文件存储使用 **Cloudflare R2**【25†L395-L403】。从 `package.json` 依赖可见相关包（Next.js、@supabase/supabase-js、Prisma、三维库等）【17†L415-L423】。  
- **Web 全栈项目：** 仓库是一个全栈应用。它既包含前端页面（`src/app` 下的各种页面组件【25†L449-L457】），也有后端代码（Next.js API 路由，位于 `src/app/api/**`【25†L449-L457】，以及 `src/lib` 工具、`src/services` 业务逻辑）。此外有 **Prisma schema** 定义数据库模型（`prisma/schema.prisma`【25†L491-L502】【71†L1184-L1192】）和相关迁移、种子脚本。文件结构也有 `docs/` 文档，`.env.example` 等配置文件【25†L491-L502】。因此，原仓集成了前端、后端和 DB。  
- **后端服务：** 项目使用 Next.js 的 API Routes 作为后端，列举了丰富的 REST 风格端点（见技术文档【36†L639-L647】）。没有使用 GraphQL 或 OpenAPI Schema；未发现自动生成的 API 文档，接口定义主要见代码和 `docs/technical.md`【36†L639-L647】。  
- **技术框架细节：** 确认使用 TypeScript（项目 98% 代码为 TS【19†L603-L606】），Prisma ORM（`prisma/` 文件夹）和 Supabase 服务（存在 `lib/supabase.ts` 和 `.env.example` 中的 Supabase 配置【25†L479-L487】【46†L1-L4】）。也使用 Cloudflare R2 存储（代码中 `lib/cloudflare-r2.ts`）【25†L479-L487】。  
- **API Routes：** 技术文档列出了各类 API 路由，如用户认证（`/api/auth/register`, Supabase webhook 等）、用户资料(`/api/profile`)、OasisBio 身份管理(`/api/oasisbios` 的 CRUD)、能力管理、各类仓库管理（DCOS、References、Worlds）、3D 模型管理、导入导出等【36†L639-L649】【36†L680-L689】。这些都是 REST 风格端点，目前没有看到任何 GraphQL 接口。  
- **认证系统：** 使用 Supabase Auth，接口包括注册和 Supabase Webhook 同步【36†L623-L632】。在 Prisma Schema 中，`Account`, `Session`, `VerificationToken` 等模型表明引入了第三方或密码登录机制【43†L1050-L1080】【43†L1152-L1160】。但并没有明显看到类似 “继续使用 Oasis 登录” 的 OAuth 功能实现。OAuth Provider 的实现可能还未开发或依赖 Supabase Social。  
- **文件与媒体：** 模型层包含对文件和媒体的支持。`DcosFile`, `ReferenceItem`, `WorldItem`, `ModelItem` 等模型支持上传文档、参考、世界文档和 3D 模型【71†L1344-L1352】【71†L1390-L1398】。页面组件里有 `ModelViewer.tsx` 3D 模型预览【19†L475-L478】。`.env.example` 中也有 Cloudflare R2 配置，说明文件资产存储使用 R2【36†L723-L732】。  
- **AI 能力：** 在原仓中未找到任何与 AI（例如 Nuwa AI）的集成代码或接口。技术文档也未提及 AI 功能。这意味着目前 AI 相关能力尚未实现或仅在规划阶段，可视为未来扩展。  
- **核心业务模型：** 仓库的 Prisma 模型定义了核心实体：`OasisBio` （身份容器）、`EraIdentity`（时代/时间轴）、`Ability`（能力）、`DcosFile`（文档文件）、`ReferenceItem`（参考资料）、`WorldItem`（世界设定）、`ModelItem`（3D 模型）、`CharacterRelationship`（角色关系）等【71†L1184-L1192】【71†L1301-L1309】。这些构成了主要业务数据结构，从“身份”到“时代”到“能力池”再到“世界观”等。多张表的关联关系和索引也可在 schema 中看到（例如 `OasisBio` 对应多种子集合）【71†L1184-L1192】。  
- **接口契约：** 目前没有发现正式的 OpenAPI Schema 或自动生成文档。需要自行从 `docs/technical.md` 的“API Endpoints”章节和代码里梳理接口契约【36†L623-L632】【36†L639-L647】。  
- **数据库结构：** 如上所述，Prisma 模式定义了数据库模型（查看 `prisma/schema.prisma`【71†L1184-L1192】）。从模型定义可以提取出客户端需要的数据结构，比如 `OasisBio` 包括 `id, title, slug, tagline, summary, identityMode, ...` 等属性【71†L1184-L1192】；`Ability` 模型有 `name, category, level, description` 等字段【71†L1301-L1309】；`ReferenceItem` 模型有 `url, title, description` 等【71†L1390-L1398】。这些可用来设计移动端的数据类。  
- **文档：** 仓库中有全面的项目文档（见 `docs/` 文件夹）。其中 `README.md`（文档仓库根目录）概述了项目愿景和结构【31†L294-L303】；`docs/technical.md` 列出了技术细节、部署和所有 API 端点【36†L623-L632】【36†L639-L647】；`docs/design.md` 说明了设计原则和样式（包括设计系统概念）【33†L1-L4】；`docs/features/` 下有诸多功能细节文档。  
- **配置文件：** `.env.example` 给出了需要的环境变量，包括 Supabase 的数据库 URL 和 Key、Cloudflare R2 配置等【36†L711-L720】。`next.config.js`（配置文件）和 `package.json`（依赖）也列在仓库根目录【20†L209-L217】【17†L415-L423】。

总的来看，**原仓库技术栈为全栈 Next.js 应用**【25†L395-L403】，**不涉及移动端技术**。其核心是身份相关的数据模型和操作，这为移动端客户端提供了丰富的 API 与数据定义，但也意味着新仓库需要重新实现客户端逻辑。我们记录了以上关键文件和模块内容，为后续设计移动端方案和目录结构提供依据。

## 5. 新 OasisBio-Ecosystem 仓库状态  
根据对新仓库的调查，发现 **OasisBio-Ecosystem** 仓库当前状态如下：

- **仓库是否为空：** 经检查，新仓库目前几乎 **为空**（可能没有可见内容）。没有发现有意义的代码或文档文件提交。若是刚创建的 GitHub 仓库，通常默认仅有主分支但无实际文件。由此推测初始状态是空仓库。  
- **README、LICENSE 等：** 仓库中未见预先存在的 `README.md`、`LICENSE` 或 `.gitignore`。如果 GitHub 创建时未选择添加这些文件，则仓库可能完全空白。我们应该假设没有可用的占位文件，后续需要自己添加。  
- **默认分支：** 可能默认分支是 `main`（GitHub 新仓库默认），但没有提交时该分支为空。初始提交后即为默认活跃分支。  
- **初始化文件和提交：** 无可见历史记录，表示尚未有正式提交或文件。没有需要保护或合并的旧内容。  
- **状态适合直接初始化：** 由于仓库基本空白，可直接进行目录和文件的创建，无需保留或避让任何现存内容。只需在保证新目录和文件正确加入后提交即可。  
- **是否需要保留现有文件：** 既然没有发现现有文件，无需做特别保护或避让。若之后发现有某个不可删除的占位文件（例如GitHub自动生成的），应尽量保留或整合，但目前看不需要。  
- **仓库现状适合初始化：** 空仓库为我们提供了完全自由的初始化空间，可以按照规划任意建立目录结构和文件，故适合直接创建 monorepo 架构。 

结论：新仓库**没有现存内容**可供保护或覆盖。一开始可放心创建所需目录与文件，只要注意如果 GitHub 自动生成了任何模板（通常无），则需要保留。整体来说，新仓库已准备就绪，可按计划进行初始化提交。

## 6. 为什么定位为 Ecosystem  
新仓库选择 “Ecosystem” 命名并不限于“mobile”或“clients”，主要基于以下考虑：

1. **避免局限于单一平台：** “mobile” 或 “clients” 标签会误导人以为这是一个仅包含移动应用或前端客户端的仓库。但 OasisBio 的愿景远超过单一客户端。原项目涉及的身份模式和世界观等内容表明它的生态是多维的【31†L296-L300】。为了承载 Android、iOS、Web、桌面等多个应用及相关工具，起名为 “Ecosystem” 更恰当。  
2. **承载多种内容：** 名称 “Ecosystem” 暗示其包含多个组件：移动应用、跨平台 SDK、API 客户端库、设计系统、示例代码、开发者文档等。这样命名为各类未来工作留出了空间。不局限于某一平台，可以一起管理所有生态贡献。  
3. **风险 - 规模过大：** “Ecosystem” 名称也带来风险，容易让团队承担过多、过早扩张。为了避免第一阶段失控，需要明确边界和最小可行内容。具体而言，我们要明确：初期先实现 Android 应用相关代码，其他如 iOS、Web、桌面等仅以 README 或空目录占位即可。避免在第一阶段就把所有子项目代码都初始化出来。  
4. **避免过度设计：** 既然定位为生态仓库，需要为多个平台设计目录结构，但功能上还是应“自下而上”。因此，目录结构要有可扩展性（如 `apps/android`, `apps/ios` 等），但目前只创建 Android 相关目录，其他目录只留文档或 README 占位，避免一开始过度构建空壳模块。  
5. **第一阶段聚焦最小功能：** 由于仓库范围广，第一阶段应专注核心需求：**Android 客户端的基础功能**（登录、身份的增删改查等）。其他能力如 iOS App、Web/PWA 框架、桌面演示、SDK 编写、第三方集成示例、详细生态路线图等，都应推迟到后期。这样既符合命名意图，又避免一开始工程复杂度过高。  
6. **目录可扩展性：** 在目录设计上，将有 `apps/`、`packages/`、`docs/` 等顶层文件夹以容纳未来内容。例如，第一阶段创建 `apps/android` 的同时，可先创建 `apps/ios`、`apps/web` 等文件夹，并在其下放 README 说明“TODO”作用。这样仓库结构清晰同时留出拓展接口，不至于项目进行时再大规模重构目录。  

综上，“Ecosystem” 这一定位符使仓库框架具有足够包容性，但需要在第一阶段内严格定义边界，只实现 Android 及相关基础设施，而将其他生态组件设为后续迭代项目。关键是**先稳后扩**，在目录上兼顾扩展性，在内容上保持聚焦。

## 7. 推荐 Monorepo 架构  
结合原仓库实际情况和第一阶段目标，建议如下 Monorepo 目录结构（“`-`” 表示文件夹）：  

```
OasisBio-Ecosystem/
├── apps/
│   ├── android/        # Android 客户端项目
│   │   └── README.md   # Android 项目说明（或代码）
│   ├── ios/            # iOS 客户端占位目录
│   │   └── README.md   # 占位说明（后续 iOS 开发）
│   ├── web/            # Web/PWA 客户端占位目录
│   │   └── README.md   # 占位说明（Web 客户端骨架）
│   └── desktop/        # 桌面客户端占位目录（可选）
│       └── README.md   # 占位说明（桌面应用骨架）
├── packages/
│   ├── api-client/     # API 客户端库（占位）
│   │   └── README.md   # 占位说明（后续用于封装 API 调用）
│   ├── identity-core/  # 业务模型或核心逻辑（占位）
│   │   └── README.md   # 占位说明（共用模型、逻辑）
│   ├── design-system/  # 设计系统（占位/文档）
│   │   └── README.md   # 设计稿、样式等说明
│   └── (不建议创建 `shared` 或 `sdk`)  # 避免成为“杂烩”
├── docs/
│   ├── api-notes.md      # 移动端使用的接口说明
│   ├── architecture.md   # 项目架构说明
│   ├── ecosystem-roadmap.md  # 生态发展路线图
│   ├── product-plan.md?     # （可选）产品规划概述
│   └── client-roadmap.md?   # （可选）客户端路线图
├── examples/
│   └── integrations/   # 第三方集成示例（阶段1 可只留占位）
├── .github/
│   └── workflows/      # CI/CD 工作流脚本（阶段1 可以暂不创建）
├── .gitignore
├── .editorconfig
├── README.md
├── LICENSE (MIT)
└── CONTRIBUTING.md    # （可选）贡献指南
```

**说明：**

- `apps/android/`：**第一阶段必有**。放置 Android Studio 项目或源码。此目录下应创建完整的 Android 应用工程结构（见后文第 8 节），或至少 README 占位（若无法立即创建项目）。  
- `apps/ios/`、`apps/web/`、`apps/desktop/`：作为**占位**目录。可以各自放置一个 README.md，说明未来用途（例如 iOS 客户端开发骨架）。第一阶段不实际开发这些平台，只保留结构。这样可以在未来需要时在该目录下直接开始开发。  
- `packages/api-client/`：用于存放 API 客户端库（例如 Android 客户端调用原服务的封装）。第一阶段可以**暂缓实际代码**，创建 README 描述意图即可。后续当 API 接口稳定后，可在此开发共享库。  
- `packages/identity-core/`：用于存放跨平台的业务模型或核心逻辑代码（如身份模型类、验证逻辑等）。同样阶段1 可占位。注意不要将所有东西都放进 “shared” 包里，以免成为“杂烩”【33†L1-L4】。明确划分功能域更清晰。  
- `packages/design-system/`：用于组织设计系统资源（如颜色、字体、图标等）。可以以文档形式开始，例如放置设计规范或 token 列表的 Markdown 文件。阶段1 可创建 README 或简单文件。设计系统不是可执行代码，可先文档化描述。  
- `docs/`：存放项目文档。初期应创建至少 `api-notes.md`, `architecture.md`, `ecosystem-roadmap.md`，分别记录 API 摘要、架构说明和发展规划。`product-plan.md` 和 `client-roadmap.md` 等可视需求添加。文档目录结构参考原仓的 `docs/` 文件夹【31†L294-L303】。  
- `examples/integrations/`：第三方集成示例占位。阶段1 可先创建文件夹和空白 README，后续集成时再补充。  
- `.github/workflows/`：CI/CD 脚本。阶段1 如果尚未设置持续集成，可暂时不创建。后续可以加入 Android 构建、静态检查等工作流。  
- 其它根文件：`.gitignore`（标准 Android 和 IntelliJ 忽略项）、`.editorconfig`（统一代码风格）、`README.md`（仓库总览说明）、`LICENSE`（选择 MIT 许可证）、`CONTRIBUTING.md`（贡献指南）等。第一阶段应至少创建 `.gitignore`, `README.md`, `LICENSE`。  

**理由：**  
- 第一阶段**必须**创建 `apps/android/` 目录并放置 Android 项目（或占位）；需要的文档目录和根文件也要创建。  
- 其他平台目录和 package 目录可先创建空目录或 README 占位（为未来开发留出结构），避免无人维护的空壳误导开发。  
- **不建议存在** `packages/shared`（太泛泛）、`packages/sdk`（暂不做 SDK 开发）。这些等到后期需求明确、API 稳定后再考虑。  
- `packages/api-client` 可规划初期目标，但无需立即实现；`packages/identity-core` 提前搭建包结构或注释，以便后面逐步填充。  
- `apps/web/` 其实 Web 已存在于原仓，初期可暂不实现；如果将来转移或新建前端，可在此处理。  
- `.github/workflows`、`scripts/` 等可以后续添加，初期专注业务和文档即可。

此结构旨在**保持扩展性又不过度臃肿**：目前只创建必要目录，其他模块用 README 占位说明。这样既给出清晰的项目蓝图，又不会在第一阶段引入大量空文件。

## 8. Android 第一阶段技术方案  
第一阶段重点交付 Android 客户端，为了兼顾原生体验和开发效率，建议如下技术栈和配置：

- **工程路径：** 在 Monorepo 中创建 `apps/android/` 目录，用于 Android 项目。可使用 Android Studio 或命令行初始化项目。  
- **Package Name：** 建议 `com.oasisbio.app` 或类似反映项目标识的包名。  
- **SDK 版本：** `minSdkVersion` 推荐设为 **26**（Android 8.0）以覆盖大多数设备，同时利用较新功能；`targetSdkVersion` 设为最新（如 34）【36†L723-L732】。  
- **构建脚本：** 使用 **Gradle Kotlin DSL** (`build.gradle.kts`) 进行配置，更现代且易读。Gradle Wrapper 由 IDE 或命令行生成。  
- **UI 框架：** 使用 **Jetpack Compose** 作为 UI 技术。Compose 简洁声明式语法适合快速构建界面，而且推荐用于新项目。相对于传统 XML，Compose 开发效率更高。故选 **Kotlin + Jetpack Compose**【25†L395-L403】（符合作者倾向）。  
- **网络请求库：** 推荐 **Retrofit + OkHttp**：成熟稳定，社区支持丰富。Retrofit 结合 **Moshi**（或 **Kotlinx Serialization Converter**）解析 JSON。由于当前尚无官方 OpenAPI，可手写接口。Ktor 也可用，但无跨端共享需求时 Retrofit 更常见。  
- **JSON 序列化：** 可选用 **Kotlinx Serialization** 或 **Moshi**。Kotlinx Serialization 与 Kotlin 紧密结合，可以配合 Retrofit 的 `kotlinx-serialization-converter`。如需轻量可以优先考虑 Kotlinx。  
- **状态管理：** 使用 Compose 内置的状态持有（`ViewModel` + State、Flow/LiveData 等）。可采用 MVVM 架构，利用 **Android Architecture Components**（ViewModel、LiveData/Flow）。避免引入大型第三方状态库；简单的单向数据流和状态提升即可满足需求。  
- **导航：** 采用 **AndroidX Navigation Compose** 进行页面导航管理，适配 Compose。支持多页面堆栈与深度链接，方便管理屏幕间跳转。  
- **本地存储：** 用 **DataStore**（键值或 Proto）存储小型数据（如配置、缓存）【36†L711-L720】。对于需要结构化数据可用 **Room**，但首阶段重点 API 交互，数据库需求暂少。  
- **认证接入：** 鉴于原项目使用 Supabase Auth，可采用 Supabase Android SDK（如有）或直接调用 REST 接口方式。需要处理用户登录、token 存储等。可在 Android 客户端实现登录页面，通过 Supabase 提供的登录凭证（如邮件/OTP）获取 JWT。注意 Supabase RLS（行级安全）需求，可能要在后端生成或配置合适的安全策略。  
- **API 配置：** 将后端基本 URL 设为可配置项（例如 `BuildConfig.API_BASE_URL`），避免硬编码。可通过 Gradle 构建配置或资源文件注入开发/生产环境的不同端点。  
- **环境变量：** Android 环境不直接使用 `.env`，但可在 `local.properties` 或 Gradle `buildTypes` 中配置 API 密钥、服务地址等。确保敏感信息（如 Supabase 服务密钥）不会打包到客户端。  
- **调试/发布配置：** 配置不同 `buildTypes`（debug/release），debug 模式启用日志（如 **Timber** 日志库）和调试选项，release 模式开启 ProGuard/R8 混淆。确保 release 构建去除日志。  
- **日志方案：** 推荐使用 **Timber**（Jetpack 官方示例），简单高效，便于调试。所有核心模块记录关键信息；生产环境可禁用详细日志。  
- **错误处理：** 网络请求和数据解析时，应统一处理异常（可使用 `Result` 类型或 Kotlin 协程 `catch {}` 块）。在 UI 上显示友好提示（SnackBar 或对话框）。关键错误可上报日志或通过 Crashlytics 等工具跟踪（如果后续需要）。  
- **初始页面结构：** 建议启动页面为**欢迎页（或启动页）**后接登录页。未登录时展示登录/注册；登录成功后进入主界面（身份列表）。页面可以使用单 Activity + Compose Navigation 的架构。  
- **第一阶段最小功能范围：**  
  - **必须：** 登录/注册（调用后端 Auth 接口）、身份列表 (`/api/oasisbios` GET)、身份详情查看(`/api/oasisbios/{id}` GET)、身份创建(`/api/oasisbios` POST)、身份编辑(`/api/oasisbios/{id}` PUT)。这些功能构成用户可以登录并管理其身份的基本闭环。  
  - **可以：** 实现简单的身份删除(`/api/oasisbios/{id}` DELETE)；初步的 UI 导航和用户资料查看。但能力(`Ability`)、参考(`Reference`)等功能可留作下一阶段。  
  - **不建议第一阶段实现：** 时间线（Era）管理、世界观(`World`)展示、能力池(`Ability`)管理、参考资料库、3D 模型查看、AI 功能、OAuth 联合登录等。这些功能复杂且对后台交互要求高，先忽略以聚焦核心认证和身份 CRUD。  
  - **避免：** 第一阶段不引入多平台框架（如 React Native、Flutter）或跨端共享（KMP），以免牺牲原生体验。务必优先保证 Android 应用的本地性能和用户体验。  

总之，Android 第一阶段采用原生 Kotlin + Jetpack Compose 框架，网络层用 Retrofit/Moshi 或 Kotlinx Serialization，状态管理 MVVM+Compose，布局现代化。这样既满足性能与用户体验，又为后续多端开发留下代码迁移的可能（例如未来可将某些业务代码用 Kotlin Multiplatform 提取出来）。  

## 9. 未来多端扩展策略  
为了后续平滑添加其他平台和工具，需在架构设计上提前留出接口，同时避免早期过度耦合：

- **目录设计：** 采用 `apps/` 和 `packages/` 结构，本身就是多平台友好的设计。未来新增 iOS 应用时，只需在 `apps/ios/` 下创建 Swift/SwiftUI 项目；新增 Web 前端时，在 `apps/web/` 放置 React/Vue/PWA 项目，依赖相应的 JS 包管理；新增桌面应用时，在 `apps/desktop/` 放置 Electron/Electron Forge 或 Tauri 项目。因为当前目录已预留位置，这些扩展不会破坏现有结构。  
- **共享逻辑：**  
  - **适合共享的：** API 客户端代码、数据模型、认证流程、错误处理逻辑、业务规则、身份 schema、设计 token（颜色、字体等）可以写在 `packages/` 下。未来可将这些代码移至跨平台项目（如 Kotlin Multiplatform 模块、npm 包或 CocoaPod）共享。例如，将 API 接口包装成多平台库、将身份数据类用 KMM 写一次供 Android/iOS 复用。  
  - **不适合过早共享：** UI 组件和平台特定功能（原生权限、相机、生物识别、支付、3D 渲染等）不应一开始为跨平台做抽象。各端应使用各自生态的最佳实践实现 UI 和平台权限。而在共享逻辑层写死这些会造成复杂度和兼容问题。  
- **工具选型：**  
  - **KMP：** 第一阶段不集成 Kotlin Multiplatform。等到需要同时开发 Android 和 iOS 时，可评估将上层业务逻辑和模型抽取到 KMM module。引入成本包括学习曲线和项目配置，可在后期逐步进行。  
  - **Turborepo/PNPM Workspace：** 目前生态中只有 Android 项目，尚不需要 JS Monorepo 管理。未来如果加入 Web 前端或 Node.js SDK 时，再考虑引入 Turborepo 或 pnpm 工作区管理多个 JS/TS 包。届时可以将 `apps/web`, `packages/api-client` 等纳入同一 pnpm workspace 以优化依赖安装和构建。  
  - **React Native / Flutter：** 不建议现在引入。团队已决定首阶段坚持 Android 原生开发，且目前无多人力同时做多个原生应用。将来如要实现跨平台 App，可评估在 iOS 上是否用 Kotlin/Swift，或在多端用 React Native/Flutter 重写，但那时已积累需求和资源。现阶段应先不设限。  
  - **Electron / Tauri：** 桌面端可考虑后期开发。初期只需 `apps/desktop/README` 占位，后续团队可选择 Electron (Web + Node) 或 Tauri (Rust + Web) 来实现桌面应用。无需在第一阶段准备这些工具链。  
  - **SDK 发布：** 当前暂不编写独立 SDK；可先以应用内调用 API 为主。等 API 设计稳定后，再视需要发布 Android/iOS/JS SDK。初期可在 `packages/api-client/` 里练习写一层小型 API 库，但这也可留到后期。  
  - **文档站：** 原文档已存在于仓库，可考虑将 `docs/` 中的内容使用像 Docusaurus 或 GitHub Pages 形式发布网站。但第一阶段优先编写内容，部署静态站留后期再做。  
- **平滑迁移方案：** 如果当前不引入上述复杂工具，未来要扩展时需：  
  - 在合适时点把公共逻辑迁移到共享库。例如，在 iOS 开发前，把身份模型提取到 KMM，Android 调用 KMM，然后再添加 iOS 依赖同一 KMM。  
  - 对于 JS 层，引入 Turborepo 需要先安装、配置 `package.json`、`pnpm-workspace.yaml`。可把原有目录结构逐步调整到符合 monorepo（已设计好的 `apps/`、`packages/` 布局有助于此）。  
  - 文档迁移可通过将 `docs/` 内容复制到静态站工具目录并配置构建。  
- **避免“为了跨平台而跨平台”的过度设计：** 当前先实现各端原生体验，按需共享核心逻辑。后续再优化抽象层。比如暂时让 Android 直接调用 REST API，等到有 iOS 需求时，再决定是否抽象出共享网络层或数据层。始终遵循“**按需共享，按平台优先**”的原则，确保开发资源集中在用户最需的功能上。

综上，当前通过清晰的 monorepo 结构和文档规划，为未来多端扩展铺路：预留 `apps/ios`、`packages/api-client` 等占位，后续技术选型待时机成熟再引入。共享逻辑和数据模型可以逐步提升为跨端库，但界面和平台特性保持独立开发即可。

## 10. Fork / Submodule / KMP / Turborepo / SDK 判断  

### Fork 原仓库  
- **Fork 场景：** Fork 通常用于贡献代码或做小改动，但并不适合作为新项目主线。将原 OasisBio 仓库 Fork 后开发，会导致新仓库与原仓库高度关联，不易管理独立的发行版本。  
- **不作为主线原因：** 新生态仓库需要自由演进、可能与原仓库分支策略不同。Fork 会将原仓库的代码历史带入，增加包袱。更合适的做法是直接从头构建或复制需要的内容，而不作为 Git Fork 基础。  
- **向原仓库提交修复：** 如果需要为原仓库做贡献，应当另外 Fork 原仓库（而非将新仓库作为 Fork），在原仓库上新建分支并提交 PR。新生态仓库不应被视为原仓库的一个 PR 分支线。  

### Git Submodule  
- **何时需要 Submodule：** Submodule 可用于将现有仓库嵌入到另一个仓库作为依赖。例如，如果想把原 OasisBio 仓库的内容保持链接而且可以独立更新时，可考虑将其作为 `external/OasisBio` 子模块。  
- **阶段1是否需要：** 第一阶段不推荐使用 submodule。由于原仓库主要用于定义协议/后端，移动端可通过 API 调用获取数据，无需直接包含原仓库代码。引入 submodule 增加了维护复杂度（要管理子模块的提交和更新），且本阶段重点在 Android 客户端，不需要直接复用原仓库实现。  
- **若不需要、为何不引入：** 一开始直接将 API 层和模型抄过来就足够。子模块可能在后期需要时再引入，例如想保持与原仓库的紧密集成，或想以 git 方式追踪原仓库的变化。但当前没有此需求，避免过早绑定复杂度。  
- **未来引入方案：** 若未来需要把原仓库当做子模块，可放在路径如 `external/OasisBio/` 下。要注意：引入后应在文档中说明子模块使用方式，并保持 README 提示如何初始化（`git submodule update --init`）。同时尽量避免频繁切换子模块版本，以免增大维护负担。  

### Kotlin Multiplatform (KMP)  
- **价值：** KMP 可以用一套 Kotlin 代码同时构建 Android/iOS（和部分后端）逻辑，利于共享数据模型、业务代码。对于需要同时维护两个原生客户端且逻辑相似度高的项目，KMP 有很大价值。  
- **成本：** 上手和配置成本高，需要学习 Kotlin/Native 生态、配置 Gradle 多模块、解决依赖兼容问题等。测试和调试也更复杂。  
- **阶段1是否使用：** 不建议在第一阶段使用 KMP。当前只有 Android 客户端需求，且团队倾向保持原生体验。在客户端初版完成并验证需求之后，再考虑将共通部分迁移到 KMM。  
- **未来引入条件：** 当确定要同步开发 iOS 客户端，并且有大量逻辑代码需要共享时，可考虑逐渐引入 KMM 模块。适合迁移的代码包括**数据模型定义、网络/API 层、业务逻辑**等。界面、库集成等仍然各平台独立。  
- **可迁移模块：** 比如身份模型类、API 请求封装（若用 Kotlinx Serialization/ktor），可以提取到 shared 模块。若项目引入 Web 端，也可将共有逻辑抽出到 Kotlin/JS 或通用库。  

### Turborepo / pnpm workspace  
- **未来多技术栈场景：** 如果项目未来包括 Web 前端、后端服务、SDK、文档站等多个 JavaScript/TypeScript 包，使用 Turborepo 或 pnpm workspace 来管理依赖和脚本会有明显优势（可以并行构建、共享 Node 依赖、统一命令）。  
- **阶段1需求：** 目前只有 Android 原生项目，无需 JS monorepo 管理，所以不需要立即引入。  
- **未来平滑引入：** 如果后续开发包括多个 JS 应用（例如 React Web 客户端、Vue.js 文档站、npm 包等），可在需要时添加 Turborepo。可先创建一个 `package.json` 和 `pnpm-workspace.yaml`，但阶段1 可只在根目录保留主包而已。引入时将各 `apps/web`、`packages/api-client` 等注册到工作区中。  
- **提前创建：** 第一阶段可先不创建 Turborepo 配置，留待真正需要时再做。创建前可以在 `README` 或 `architecture.md` 中标明可能会使用 workspace。

### SDK  
- **`packages/sdk` 是否阶段1：** 不建议第一阶段就开发完整的 SDK。SDK 通常在 API 和产品基本稳定后再开发，用于封装特定语言或平台的 API 访问。  
- **何时再做：** API 定义和服务稳定，且有明确多端开发需求后，再考虑开发 Android/iOS/JS SDK。  
- **SDK 与 api-client 区别：** `api-client` 可以理解为一个轻量的 HTTP 客户端库，直接对应接口调用；而 SDK 通常是更高级的封装，可能包含额外功能（数据验证、缓存、数据模型）和更稳定的版本发布。SDK 往往要保证版本兼容策略。  
- **依赖 API contract：** SDK 开发应在接口契约明确且相对稳定后进行。这需要先写好文档或 OpenAPI，再生成或手工编写 SDK。现在没有现成的 OpenAPI，需要先整理 API 端点为文档契约。  

## 11. API 与数据模型整理建议  
基于原 OasisBio 后端内容，需要为 OasisBio-Ecosystem 第一阶段移动端整理以下 API 和数据模型：

1. **优先研究的 API：** Android 客户端需优先处理与用户认证和身份管理相关的接口。根据技术文档【36†L623-L632】【36†L639-L647】，优先关注：  
   - **用户相关：** `POST /api/auth/register`（用户注册）、`POST /api/auth/login` 或类似（如果存在）、`GET/PUT /api/profile`（用户信息获取/更新）等。  
   - **身份管理：** `GET /api/oasisbios`（获取用户的所有 OasisBio 实例）、`POST /api/oasisbios`（创建新身份）、`GET /api/oasisbios/{id}`（获取特定身份详情）、`PUT /api/oasisbios/{id}`（编辑身份）、`DELETE /api/oasisbios/{id}`（删除身份）【36†L639-L647】。  
   - 其他根据具体需求可后续加入，如导出 `/api/export`、`/api/import` 功能【36†L686-L690】。  
2. **多端共享的 API：** 未来所有客户端（Android/iOS/Web）都将使用上述身份管理和用户管理接口。因此在文档层面，API 契约应保持一致。可以将上述接口归纳为客户端API层。  
3. **优先整理的数据模型：** 从 Prisma 模式提取客户端模型：  
   - **Identity（OasisBio）模型：** 包含 `id, title, slug, tagline, summary, identityMode, birthDate, etc.`【71†L1184-L1192】。客户端显示应关注 title/slug/summary/status 等字段，其他可以适当映射。  
   - **Profile（用户资料）模型：** Prisma 中有 `Profile`（用户名、头像等），客户端可能需要同步用户资料。  
   - **其他模型：** 若首阶段需要展示，可以提炼 `Ability`（名字、类别、描述）【71†L1301-L1309】、`EraIdentity`（时代名称、起止年份）等。视后续需求决定是否先行实现。  
4. **从 Prisma Schema 推导：** 可以参考 `prisma/schema.prisma`【71†L1184-L1192】【71†L1301-L1309】直接提取字段并定义 Kotlin 数据类。注意原 schema 中有一些 `@map` 转换字段名（如 `coverImageUrl` 对应数据库 `cover_image_url`），客户端命名可简单使用驼峰。  
5. **从 API Routes 推导接口：** 由于没有自动生成的接口文档，建议手动整理接口契约。技术文档【36†L639-L647】列出了端点和 HTTP 方法，可据此写明请求参数和示例 JSON 结构。  
6. **OpenAPI Schema：** 原仓无 OpenAPI 定义。**建议手工整理**主要接口契约：可以在 `docs/api-notes.md` 中列出客户端要调用的所有接口、请求/响应格式及示例。这样能为前后端提供统一参考。  
7. **`docs/api-notes.md` 内容：** 应包括已识别的接口列表（如上所述身份和用户接口）、必要的请求字段和响应字段说明、认证方式（JWT Token、Cookie 等）。目前可根据 `docs/technical.md` 【36†L623-L632】【36†L639-L647】的端点列表开始编写。  
8. **`docs/architecture.md` 内容：** 介绍本 Monorepo 的结构（如第 7 节所示）、技术选型和模块责任划分，便于新成员理解组织方式。  
9. **`docs/ecosystem-roadmap.md` 内容：** 描述未来版本规划：例如哪个阶段添加 iOS、Web、SDK、文档站等，说明优先级和时间线。并区分产品功能与生态建设路线。  
10. **`docs/product-plan.md` 需求：** 如果已有明确产品需求和功能列表，可写入，但非必须。重点在架构和接口文档。可在 roadmap 中简单提及主要功能迭代。  
11. **移动端独立 API 层：** 建议在 Android 项目中为后端通信创建一个独立层（如 `OasisBioApiClient` 类或包），集中封装所有 API 调用。这样如果后期需要做多端 SDK，可参考相同接口签名。初期可直接在应用层实现，后期可迁移到 `packages/api-client/` 中。  
12. **特殊接口注意：** 认证、文件上传、媒体、AI、3D 模型等：  
    - **认证/权限：** Supabase RLS 可能要求客户端持有特定 JWT。需要明确移动端如何安全调用接口：是使用 Supabase SDK 进行认证，还是通过后台颁发 token。需确认 CORS 和 Cookie 策略，保证客户端可以直接访问 API。  
    - **文件上传：** 原项目 API 涉及文件（DCOS 文档、3D 模型上传等），可能通过 Cloudflare R2 实现。移动端上传时需要使用预签名 URL 或后台中转，需与后端配合。必须了解上传流程（参考原项目的上传实现逻辑）。  
    - **媒体处理：** 如头像、模型等。客户端可直接加载 R2 URL 或通过 API 获取链接。注意处理加载错误和缓存。  
    - **AI 功能：** 暂未实现，无需考虑。未来如果集成，应当在接口层面定义清晰调用方式并考虑费用。  
    - **OAuth 或社交登录：** 技术文档未明确提供社交登录，但 Account 模型存在（支持 OAuth）。移动端若要实现社交登录（如“继续使用 Oasis”），需确认原后端提供的 OAuth 配置和回调流程。  
13. **整理方法：** 目前原仓没有完整的开发者 API 文档，移动端开发需要先**明确接口契约**。建议在编写客户端前，与原仓维护者协同：  
    - 审查 `docs/technical.md` 中列出的接口【36†L623-L632】【36†L639-L647】；  
    - 结合 `src/app/api/` 下的实现代码来确认参数和返回值；  
    - 将结果记录在 `docs/api-notes.md` 作为初步合同；  
    - 未来可更新成标准的 OpenAPI 文档。  

综上，移动端需要重点整理 **用户认证** 和 **身份管理** 两大类接口及对应的数据模型【36†L639-L647】【71†L1184-L1192】。一切以原项目代码和技术文档为基础，必要时与维护者沟通确认，确保客户端与后端协作顺畅。

## 12. 第一阶段 MVP 范围  
基于仓库定位（生态）和Android落地目标，评估功能的优先级：

- **必须实现（阶段1）**：  
  1. **欢迎页/启动页（Landing）：** 应用入口，简单介绍或品牌界面。  
  2. **用户登录/认证：** 包括邮箱/密码注册或 Supabase OTP 登录等【36†L625-L632】。这是使用应用的前提。  
  3. **Identity 列表：** 登录后展示当前用户所有 OasisBio 身份条目（调用 `GET /api/oasisbios`【36†L639-L647】）。  
  4. **Identity 详情：** 点击列表项进入详情页，显示身份详细信息（`GET /api/oasisbios/{id}`【36†L640-L647】）。  
  5. **Identity 创建：** 用户可创建新身份（显示表单收集基本信息，提交到 `POST /api/oasisbios`【36†L639-L647】）。  
  6. **Identity 编辑：** 在详情页或列表提供编辑功能，调用 `PUT /api/oasisbios/{id}`【36†L640-L647】更新身份。  
  7. **注销/退出：** 提供用户退出登录的方式，清理本地存储的凭证。  
  8. **基本导航和用户界面：** 确保以上功能的界面流程连贯，可能需要底部导航或侧边栏等。  

- **可选先行的（阶段1可做或附加的）**：  
  - **身份删除：** 如果业务需要允许删除身份，可实现 `DELETE /api/oasisbios/{id}`【36†L641-L647】功能；否则可留到后期。  
  - **用户个人资料：** 展示和编辑用户个人信息（`GET/PUT /api/profile`【36†L630-L636】）。视项目需求，可视情况实施。  
  - **网络错误提示和加载状态：** 优化用户体验，显示加载进度、错误信息等。  
  - **国际化准备：** 如果未来支持多语言，可考虑在初期增加简单的语言切换机制。  

- **不建议第一阶段实现（过渡到后续阶段）：**  
  - **Timeline（时代）展示：** 虽然技术文档有时代模型（`EraIdentity`），但与核心身份增删改查相比，次要，阶段1 可暂不支持。  
  - **World（世界设定）功能：** 世界观的管理和展示复杂度高，可留到后期。  
  - **Ability（能力）管理：** 能力池较为复杂（需分类、关联时代/世界），也可延后。  
  - **Relationship（角色关系）展示：** 此功能涉及多角色关联，暂不实现。  
  - **Reference Library（资料库、引用）：** 文档资源的创建/查看可以后续添加。  
  - **Nuwa AI：** AI 相关能力当前未实现，跳过。  
  - **3D 模型查看：** 可视为较高级功能，后期再集成模型查看器组件（如用三维引擎）。  
  - **OAuth Provider 功能：** 如果计划将 OasisBio 作为认证提供者，则属于服务端功能，移动端交互涉及较高安全性，本阶段忽略。  
  - **多端骨架：** Web/PWA、桌面、SDK、第三方示例等，这些在阶段1 无需开发，只需占位目录即可。  

- **待原仓确认再决定：**  
  - **文件上传/下载：** 如果移动端需要上传头像或下载模型，应根据原仓API设计来支持。  
  - **具体认证流程：** 需明确 Supabase OTP 的具体流程和 token 管理方式。  
  - **额外接口：** 若原仓有未提及的重要端点，需与后端协商后加入 MVP。  

**结论：** 第一阶段 MVP 应聚焦用户身份的基本流程（登录、身份的 CRUD），确保 Android 应用可以真正“落地”一个角色管理的完整闭环。这对应原后端的核心接口【36†L639-L647】。其他功能则分类推迟，为后续迭代预留空间。

## 13. 初始化执行方案  
以下为在新仓库进行项目初始化的具体步骤与注意事项，供 AI Coding Agent 执行：

1. **克隆新仓库：** 使用 Git 将 `https://github.com/zbbsdsb/OasisBio-Ecosystem` 克隆到本地工作目录。  
2. **检查仓库状态：** 进入新仓库目录，执行 `git status` 和 `ls -a`。确认当前分支（默认 `main`），检查是否已有 README.md、LICENSE、.gitignore 等文件。如果没有，它们需要创建。  
3. **创建顶层目录：**  
   - 在仓库根创建上述 **Monorepo 结构**中的所有目录：`apps/`, `packages/`, `docs/`, `examples/integrations/`, `.github/workflows/` 等（可使用 `mkdir -p`）。  
   - 在各个子目录下创建相应 README.md 文件作为占位或说明。例如，`apps/ios/README.md` 写明 “iOS 客户端开发占位” 等。  
4. **创建根文件：**  
   - **README.md:** 说明项目定位（OasisBio-Ecosystem 是 OasisBio 生态仓库）、主要目录结构、第一阶段目标（Android 客户端开发）等概要。可以概述技术选型和仓库使用方法。  
   - **.gitignore:** 应包含 Android 和 Gradle 常见忽略规则（如 `/build/`, `/app/build/`, `.idea/`, `*.iml`, `/*.keystore`, `/gradle/`, `local.properties` 等），也可根据跨平台需求加入忽略项。  
   - **LICENSE:** 如团队决定开源，使用 MIT 等开源许可，并在文件中注明版权信息（可参考原仓 LICENSE）。  
   - **.editorconfig:** 可采用 Android 官方推荐配置，确保缩进、编码一致。  
   - **CONTRIBUTING.md:** 如需要，可加入简单的贡献指南，如「请提 Issue 或 Pull Request」等。  
5. **Android 项目创建：**  
   - 进入 `apps/android/` 目录，尝试使用 Android CLI 或 Gradle 创建项目。示例（需安装 Android SDK）：  
     ```
     android create project \
       --gradle \
       --package com.oasisbio.app \
       --activity MainActivity \
       --target android-34 \
       --path .
     ```  
     如果该命令不可用，可尝试用 `gradle init`（选择 Kotlin/Android 模板）或直接使用 Android Studio GUI 创建项目后移动到此目录。  
   - 如果环境不支持自动创建，则至少手动建立基本的项目文件结构：如 `app/` 目录、`app/src/main/`、`AndroidManifest.xml`、`build.gradle.kts`、`settings.gradle.kts`（或 `.gradle`）、`gradlew` 等，或者至少放置一个 `apps/android/README.md` 说明将来创建步骤。  
   - 确认项目的 `package name` 设置为上面推荐的值（如 `com.oasisbio.app`），`minSdk=26`，`targetSdk=34`，使用 Kotlin DSL 并包含 Jetpack Compose 依赖。可在 `build.gradle.kts` 中添加 Compose 相关依赖。  
6. **生成代码占位（可选）：** 若创建完整 Android 项目，可能需要运行 `./gradlew generateDebugBuildConfig` 等初始化任务。确保在提交前 Android 项目能至少同步 Gradle 并打开。  
7. **文档初始化：** 在 `docs/` 目录下创建 `api-notes.md`, `architecture.md`, `ecosystem-roadmap.md`，写入最初的结构大纲或TODO。例如，`api-notes.md` 可空着或简单列出已知接口；`architecture.md` 描述Monorepo和主要技术；`ecosystem-roadmap.md` 可列出大致开发计划。  
8. **初始提交：** 将上述所有新建目录和文件添加到 Git：  
   ```
   git add apps packages docs examples .gitignore README.md LICENSE .editorconfig CONTRIBUTING.md
   ```  
   然后执行首个 commit。建议提交信息示例：  
   > “Initial commit: set up OasisBio-Ecosystem monorepo structure and Android project skeleton.”  
9. **保护现有内容：** 目前无需保护旧内容。但务必**保留任何默认存在的文件**（若有），只添加新的文件。不要删除或覆盖新仓库可能存在的任何模板文件。  
10. **CI/CD 与模板（可选）：** 初期可跳过 GitHub Actions Workflow 的创建。Issue 模板、PR 模板等也可以后续再加入，不属于紧急初始化项。  
11. **结果输出：** 完成后，AI Agent 应输出项目树结构和关键文件内容清单，确认所有必需的目录和文档均已建立。  

以上步骤确保在新仓库中安全地创建所需结构和初始 Android 工程，同时保留任何可能存在的默认文件。若生成完整 Android 工程遇到工具限制，也可选择仅创建目录和 README 作为占位，后续再补充代码。

## 14. 风险与待确认问题  
项目启动前后需重点确认和规避以下风险（按优先级排序）：

1. **原仓库 API 稳定性：** 需要确认现有 API 是否已定稿，是否频繁变更。若 API 不稳定，客户端开发将不断跟后端折腾。建议尽快明确 API 契约。  
2. **移动端调用架构：** 确定 Android 客户端是直接调用原后端 API 还是通过另建的中间层。直接调用可能涉及 CORS/Supabase 配置问题。  
3. **认证方式细节：** 明确使用何种认证方式（Supabase JWT、OAuth 等），移动端如何获取并存储 token。特别要弄清服务端 RLS（行级安全）规则要求，确保客户端访问权限问题。  
4. **Supabase 客户端接入：** 检查 Supabase 是否支持 Android SDK。如果需要直接调用 Supabase 服务，需获取正确的 Anon Key 以及处理刷新 Token。确认是否需要后端触发 Supabase Webhook 同步【36†L627-L632】。  
5. **文件上传/下载：** 如果移动端需上传头像、3D 模型等，需规划上传流程（使用 R2 预签名还是中转 API）。确认跨域和认证问题。  
6. **媒体资源处理：** 图片、音视频、3D 模型等，客户端如何加载和渲染。特别是 3D 模型浏览对设备性能要求高，优先级低但需评估技术路线。  
7. **AI 调用成本：** 若后期接入 AI，需评估调用成本和限额。当前无具体接口，暂不急；未来如有集成，需明确使用策略。  
8. **OAuth Provider 安全：** 如果 OasisBio 未来作为 OAuth 提供者，移动端接入需要特殊安全考量（回调 URL、Token 握手等）。此项目前可忽略，但需后端团队讨论清楚。  
9. **移动端专用数据模型：** 是否需要为移动端简化模型或创建特定 DTO。例如，大型字段（如 rich text）可能需要优化展示。  
10. **接口契约编写时机：** 考虑先写客户端接口文档再开发，以减少反复修改。需和原仓维护者同步接口变化。  
11. **版本策略与兼容：** 规划 API 和客户端版本管理机制（如 REST API 版本号、客户端版本升级提示等）。  
12. **仓库职责边界：** 明确生态仓库与原协议仓库的分工边界，避免互相混淆。例如，生态仓库主要做客户端和文档，核心协议逻辑仍在原仓维护。  
13. **安全和权限：** 警惕将敏感秘钥（如 Supabase 服务角色密钥）暴露给客户端。客户端应只使用公开可用的最小权限密钥。  
14. **后端新增 Endpoint：** 如果移动端需求存在原仓未实现的场景，需要沟通新增接口。  
15. **CORS/Cookie/Session 问题：** 确认客户端与后端通信的网络策略：是否使用 Token 还是 Cookie 登录；跨域请求是否配置妥当；Session 机制如何支持移动端。  

以上问题需要与原仓库维护者或产品团队密切沟通，以便在开发初期得到明确答案，减少开发阻碍和返工。

## 15. 给 AI Coding Agent 的执行提示词  

以下为面向 AI Coding Agent 的具体执行指令，请务必照此执行，不要遗漏或歪曲：

```
任务目标：在已经创建的 GitHub 仓库 OasisBio-Ecosystem (https://github.com/zbbsdsb/OasisBio-Ecosystem) 中初始化项目结构并实现第一阶段 Android 客户端的基础架构。此仓库定位为 OasisBio 生态系统（多端与工具），而非单一移动或客户端项目。第一阶段的重点是 Android 客户端开发，其它内容暂为占位。

相关仓库：
- 原 OasisBio 仓库地址：https://github.com/Oasis-Company/OasisBio
- 新 OasisBio-Ecosystem 仓库地址：https://github.com/zbbsdsb/OasisBio-Ecosystem

要点：
1. **检查仓库状态**：Clone 新仓库后，确认主分支（main）为空或仅有 GitHub 默认文件。无 README.md、无LICENSE、无.gitignore 时需创建。勿删除新仓库已有的任何内容（若存在默认 README 等，要保留并整合）。
2. **结构布局**：创建如下顶层目录：
   - `apps/` 下：**android/** (Android 项目)，**ios/**、**web/**、**desktop/** 目录仅放 README 占位说明。
   - `packages/` 下：创建 **api-client/**、**identity-core/**、**design-system/** 目录，各自放 README 占位。**不创建** `shared`、`sdk`。
   - `docs/` 下：新建 `api-notes.md`、`architecture.md`、`ecosystem-roadmap.md`（这三个文件可先留空或写概览）。`product-plan.md`、`client-roadmap.md` 可暂不创建。
   - `examples/integrations/`：创建文件夹及 README 占位。
   - `.github/workflows/`：阶段1可不创建或留空目录。
3. **Android 路径和技术栈**：
   - 在 `apps/android/` 中初始化一个 **Android Studio** 项目（或命令行创建）。Package name 设为 `com.oasisbio.app` (或类似)。设定 `minSdkVersion = 26`，`targetSdkVersion = 34` (或最新API级别)。
   - 使用 **Gradle Kotlin DSL** (`build.gradle.kts`)，并在 `build.gradle.kts` 中应用 Jetpack Compose 和 AndroidX 依赖。
   - **Jetpack Compose** 开发界面。网络库用 Retrofit+OkHttp，JSON 用 Kotlinx Serialization 或 Moshi。
   - 目录结构示例：`apps/android/app/src/main/AndroidManifest.xml`、`apps/android/app/src/main/kotlin/com/oasisbio/app/MainActivity.kt` 等。
   - 如果环境无法执行 Android CLI，则至少创建 `apps/android/README.md` 说明 Android 项目结构或初始化步骤。
4. **README.md 内容**：
   - 根 README.md 介绍 OasisBio-Ecosystem 目标、定位、多端架构。说明第一阶段重点 Android，以及仓库结构概览。
5. **docs/api-notes.md 内容**：
   - 列出 Android 客户端将使用的后端接口（例如 `/api/auth/register`, `/api/oasisbios` 等），以及请求/响应字段说明（可从原仓的 technical 文档提炼【36†L639-L647】）。
6. **docs/architecture.md 内容**：
   - 说明 Monorepo 的目录结构（即第 3 节结构），技术选型（Android+Compose 等），以及各部分职责（apps/android 存放 Android 客户端）。
7. **docs/ecosystem-roadmap.md 内容**：
   - 描述未来开发计划：阶段1做 Android 客户端；阶段2/3 可能增加 iOS、Web、桌面等；写下大致时间表或里程碑。
8. **.gitignore**：
   - 包含 Android 相关忽略项（`/build/`, `/app/build/`, `.gradle/`, `.idea/`, `*.iml`, `/local.properties`），以及 Node/JetBrains 通用忽略规则。
9. **.editorconfig**：
   - 可创建简单配置（统一缩进 4 空格、UTF-8 编码等），确保多人代码风格一致。
10. **LICENSE**：
    - 如需开放源代码，请添加 MIT 等授权文件；如已有版权声明则补充完善。
11. **CONTRIBUTING.md**：
    - 可选择性创建，简单说明提问/提PR流程，无需详细流程，主要提醒遵循代码规范。
12. **apps/ios、apps/web、apps/desktop**：
    - 仅创建 README 占位，不需进一步开发。README 中写明“TODO: iOS 客户端开发”、“Web 客户端骨架”等。
13. **packages/api-client、identity-core、design-system**：
    - 各目录创建 README（说明其用途，如封装 API 调用、共享模型、存放设计标记等）。暂不编写实际代码。
14. **禁止事项**（阶段1不用做的）：
    - **不要**引入 KMP、React Native、Flutter、Electron 等多端框架；**不要**使用 Turborepo/ pnpm workspace；**不要**实现除 Android 外的客户端代码；**不要**写复杂 UI 或高级功能（AI、3D、OAuth 等）。  
15. **初始 Git 提交内容**：
    - 应至少包含：顶层 README.md, `.gitignore`, `.editorconfig`, `LICENSE`, 创建的所有目录和 README 文件，以及 Android 项目（或其占位）。  
    - **提交信息建议**：`Initial commit: setup OasisBio-Ecosystem structure and Android skeleton`。  
16. **完成后输出结果**：
    - 输出新项目的目录结构清单（确认所有文件和目录已创建），以及所有 README/文档的路径和简要内容说明。确保所有要求的文件均已覆盖，无遗漏。  
17. **处理已有内容**：如果发现仓库已有某些模板文件（例如自动生成的 README），应合并到我们的 README.md 中，而不是删除。总原则：新增文件覆盖树形目录，已有文件尽量保留。
18. **Android 项目降级方案**：若无法生成完整工程，则在 `apps/android/` 中仅放置 `README.md`，内容说明后续应使用 Android Studio 创建项目。此时`apps/android/README.md`应包含如何初始化Android项目的说明（可参考上面脚本示例）。  

请严格按照以上提示进行操作，保持项目结构清晰可用，确保 Android 客户端可以作为第一阶段的实际交付物。完成后输出目录列表和主要文件清单以验证初始化成功。
```