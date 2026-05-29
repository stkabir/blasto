# Capacitor
-keep class com.getcapacitor.** { *; }

# Google AdMob
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.common.** { *; }
-dontwarn com.google.android.gms.ads.**

# Google Play Billing
-keep class com.android.billingclient.** { *; }
-dontwarn com.android.billingclient.**

# Keep plugins
-keep class pro.blasto.game.AdMobPlugin { *; }
-keep class pro.blasto.game.BillingPlugin { *; }
-keep class pro.blasto.game.MainActivity { *; }

# Keep all Capacitor plugin annotations
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepattributes *Annotation*

# WebView JS interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
