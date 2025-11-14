"use client";
import { merge } from "es-toolkit";
import { useBoolean } from "minimal-shared/hooks";

import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";

import { NavMobile } from "./nav-mobile";
import { NavVertical } from "./nav-vertical";
import { layoutClasses } from "../core/classes";
import { _account } from "../nav-config-account";
import { MainSection } from "../core/main-section";
import { Searchbar } from "../components/searchbar";
import { MenuButton } from "../components/menu-button";
import { HeaderSection } from "../core/header-section";
import { LayoutSection } from "../core/layout-section";
import { AccountDrawer } from "../components/account-drawer";
import { navData as dashboardNavData } from "../nav-config-dashboard";
import { partnerNavData } from "../nav-config-dashboard";
import { dashboardLayoutVars, dashboardNavColorVars } from "./css-vars";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import dayjs from "dayjs";
import "dayjs/locale/ko";
import { paths } from "src/routes/paths";
import { Button } from "@mui/material";
import { SignOutButton } from "../components/sign-out-button";
import { useAuthContext } from "src/auth/hooks";
dayjs.locale("ko");

// ----------------------------------------------------------------------

export function DashboardLayout({
  sx,
  cssVars,
  children,
  slotProps,
  layoutQuery = "lg",
}) {
  const theme = useTheme();

  const { user } = useAuthContext();

  const navVars = dashboardNavColorVars(theme);

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  //# 여기 변경함 - 사용자 역할에 따라 네비게이션 결정

  // 사용자 역할에 따라 네비게이션 결정
  const isAdmin = user?.role === "admin" || user?.role === "ADMIN";
  const isPartner =
    user?.role === "partner" ||
    user?.role === "PARTNER" ||
    user?.role === "seller" ||
    user?.role === "SELLER";

  // 기본적으로는 partner 네비게이션을 사용하고, admin 역할일 때만 admin 네비게이션 사용
  const navData = isAdmin ? dashboardNavData : partnerNavData;

  const isNavMini = false;
  const isNavVertical = isNavMini || true;

  const canDisplayItemByRole = (allowedRoles) =>
    !allowedRoles?.includes(user?.role);

  const renderHeader = () => {
    const headerSlotProps = {
      container: {
        maxWidth: false,
        sx: {
          ...(isNavVertical && { px: { [layoutQuery]: 5 } }),
        },
      },
    };

    const headerSlots = {
      topArea: (
        <Alert severity="info" sx={{ display: "none", borderRadius: 0 }}>
          This is an info Alert.
        </Alert>
      ),
      leftArea: (
        <>
          {/** @slot Nav mobile */}
          <MenuButton
            onClick={onOpen}
            sx={{
              mr: 1,
              ml: -1,
              [theme.breakpoints.up(layoutQuery)]: { display: "none" },
            }}
          />
          <NavMobile
            data={navData}
            open={open}
            onClose={onClose}
            cssVars={navVars.section}
            checkPermissions={canDisplayItemByRole}
          />
        </>
      ),
      rightArea: (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0, sm: 0.75 },
          }}
        >
          {/** @slot Searchbar */}
          <Searchbar data={navData} />

          {/** @slot Notifications popover */}
          {/* <NotificationsDrawer data={_notifications} /> */}

          {/** @slot Account drawer */}
          {user ? (
            <Box sx={{ p: 1 }}>
              <SignOutButton
                size="medium"
                variant="outlined"
                onClose={onClose}
                sx={{ display: "block", textAlign: "left" }}
              />
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              href={paths.auth.jwt.signIn}
              sx={{ ml: 2 }}
            >
              로그인
            </Button>
          )}
        </Box>
      ),
    };

    return (
      <HeaderSection
        layoutQuery={layoutQuery}
        disableElevation={isNavVertical}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={slotProps?.header?.sx}
      />
    );
  };

  const renderSidebar = () => (
    <NavVertical
      data={navData}
      isNavMini={isNavMini}
      layoutQuery={layoutQuery}
      cssVars={navVars.section}
      checkPermissions={canDisplayItemByRole}
    />
  );

  const renderFooter = () => null;

  const renderMain = () => (
    <MainSection {...slotProps?.main}>{children}</MainSection>
  );

  return (
    <LayoutSection
      /** **************************************
       * @Header
       *************************************** */
      headerSection={renderHeader()}
      /** **************************************
       * @Sidebar
       *************************************** */
      sidebarSection={renderSidebar()}
      /** **************************************
       * @Footer
       *************************************** */
      footerSection={renderFooter()}
      /** **************************************
       * @Styles
       *************************************** */
      cssVars={{ ...dashboardLayoutVars(theme), ...navVars.layout, ...cssVars }}
      sx={[
        {
          [`& .${layoutClasses.sidebarContainer}`]: {
            [theme.breakpoints.up(layoutQuery)]: {
              pl: isNavMini
                ? "var(--layout-nav-mini-width)"
                : "var(--layout-nav-vertical-width)",
              transition: theme.transitions.create(["padding-left"], {
                easing: "var(--layout-transition-easing)",
                duration: "var(--layout-transition-duration)",
              }),
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
        {renderMain()}
      </LocalizationProvider>
    </LayoutSection>
  );
}
