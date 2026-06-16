declare global {
  interface Window {
    DaegaCalendarAndroid?: {
      refreshWidget(): void;
    };
  }
}

/** Android WebView에서 예약 실시간 반영 시 홈 위젯 갱신 */
export function notifyAndroidWidgetRefresh(): void {
  try {
    window.DaegaCalendarAndroid?.refreshWidget();
  } catch {
    // WebView 브릿지 없음
  }
}
