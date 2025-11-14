import React from "react";
import "src/global.css";

import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

import { CONFIG } from "src/global-config";
import { primary } from "src/theme/core/palette";
import { themeConfig, ThemeProvider } from "src/theme";

import { ProgressBar } from "src/components/progress-bar";
import { MotionLazy } from "src/components/animate/motion-lazy";

import { AuthProvider } from "src/auth/context/jwt";

// ----------------------------------------------------------------------

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: primary.main,
};

export const metadata = {
  icons: [
    {
      rel: "icon",
      url: `${CONFIG.assetsDir}/favicon.ico`,
    },
  ],
};

// ----------------------------------------------------------------------

async function getAppConfig() {
  if (CONFIG.isStaticExport) {
    return {
      cookieSettings: undefined,
    };
  } else {
    return {};
  }
}

export default async function RootLayout({ children }) {
  const appConfig = await getAppConfig();

  return (
    <html lang="en" dir={appConfig.dir} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript
          modeStorageKey={themeConfig.modeStorageKey}
          attribute={themeConfig.cssVariables.colorSchemeSelector}
          defaultMode={
            themeConfig.enableSystemMode ? "system" : themeConfig.defaultMode
          }
        />

        <AuthProvider>
          <AppRouterCacheProvider options={{ key: "css" }}>
            <ThemeProvider
              modeStorageKey={themeConfig.modeStorageKey}
              defaultMode={
                themeConfig.enableSystemMode
                  ? "system"
                  : themeConfig.defaultMode
              }
            >
              <MotionLazy>
                <ProgressBar />
                {children}
              </MotionLazy>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
