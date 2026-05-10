-keepattributes Signature
-keepattributes Annotation

-keepclassmembers class **.R$* {
    public static <fields>;
}

-keep class com.oasisbio.app.data.remote.** { *; }
-keep class com.oasisbio.app.domain.model.** { *; }

-dontwarn okhttp3.**
-dontwarn retrofit2.**
-dontwarn io.github.jan_tennert.supabase.**

-keepclasseswithmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

-keepclasseswithmembers class * {
    @kotlinx.serialization.Serializable <methods>;
}

-keep class androidx.compose.** { *; }
-keepclassmembers class androidx.compose.** { *; }