# Keep BuildConfig
-keep class com.daega.calendar.BuildConfig { *; }

# WebView → 위젯 갱신 브릿지
-keepclassmembers class com.daega.calendar.widget.WidgetBridge {
    @android.webkit.JavascriptInterface <methods>;
}
