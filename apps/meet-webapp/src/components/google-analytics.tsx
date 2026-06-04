import Script from "next/script";
import { Suspense } from "react";

import { GoogleAnalyticsPageView } from "@/components/google-analytics-pageview";

const GA_MEASUREMENT_ID = "G-BN5KD8FK2R";

export function GoogleAnalytics() {
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsPageView measurementId={GA_MEASUREMENT_ID} />
      </Suspense>
    </>
  );
}
