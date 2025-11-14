import { useBoolean } from "minimal-shared/hooks";
import { useRef, useEffect, useCallback } from "react";
import { isActiveLink, isExternalLink } from "minimal-shared/utils";

import { usePathname } from "src/routes/hooks";

import { NavItem } from "./nav-item";
import { navSectionClasses } from "../styles";
import { NavUl, NavLi, NavCollapse } from "../components";

// ----------------------------------------------------------------------

export function NavList({
  data,
  depth,
  render,
  slotProps,
  checkPermissions,
  enabledRootRedirect,
}) {
  const pathname = usePathname();
  const navItemRef = useRef(null);

  // 부모 또는 자식 경로가 현재 경로와 일치하면 true
  const isSelfActive = isActiveLink(pathname, data.path, !!data.children);
  const hasActiveChild =
    data.children?.some((child) => isActiveLink(pathname, child.path, true)) ??
    false;

  const isActive = isSelfActive || hasActiveChild;

  // isActive 초기값으로 open 상태 설정
  const {
    value: open,
    onFalse: closeMenu,
    onTrue: openMenu,
    onToggle,
  } = useBoolean(isActive);

  useEffect(() => {
    if (isActive) {
      openMenu();
    } else {
      closeMenu();
    }
  }, [isActive, openMenu, closeMenu]);

  const handleToggleMenu = useCallback(() => {
    if (data.children) {
      onToggle();
    }
  }, [data.children, onToggle]);

  // NavItem 렌더링
  const renderNavItem = () => (
    <NavItem
      ref={navItemRef}
      path={data.path}
      icon={data.icon}
      info={data.info}
      title={data.title}
      caption={data.caption}
      open={open}
      active={isActive}
      disabled={data.disabled}
      depth={depth}
      render={render}
      hasChild={!!data.children}
      externalLink={isExternalLink(data.path)}
      enabledRootRedirect={enabledRootRedirect}
      slotProps={depth === 1 ? slotProps?.rootItem : slotProps?.subItem}
      onClick={handleToggleMenu}
    />
  );

  // 자식 메뉴 렌더링
  const renderCollapse = () =>
    !!data.children && (
      <NavCollapse
        mountOnEnter
        unmountOnExit
        depth={depth}
        in={open}
        data-group={data.title}
      >
        <NavSubList
          data={data.children}
          render={render}
          depth={depth}
          slotProps={slotProps}
          checkPermissions={checkPermissions}
          enabledRootRedirect={enabledRootRedirect}
        />
      </NavCollapse>
    );

  // 권한 검사
  if (
    data.allowedRoles &&
    checkPermissions &&
    checkPermissions(data.allowedRoles)
  ) {
    return null;
  }

  return (
    <NavLi
      disabled={data.disabled}
      sx={{
        ...(!!data.children && {
          [`& .${navSectionClasses.li}`]: {
            "&:first-of-type": { mt: "var(--nav-item-gap)" },
          },
        }),
      }}
    >
      {renderNavItem()}
      {renderCollapse()}
    </NavLi>
  );
}

// ----------------------------------------------------------------------

function NavSubList({
  data,
  render,
  depth = 0,
  slotProps,
  checkPermissions,
  enabledRootRedirect,
}) {
  return (
    <NavUl sx={{ gap: "var(--nav-item-gap)" }}>
      {data.map((item) => (
        <NavList
          key={item.title}
          data={item}
          render={render}
          depth={depth + 1}
          slotProps={slotProps}
          checkPermissions={checkPermissions}
          enabledRootRedirect={enabledRootRedirect}
        />
      ))}
    </NavUl>
  );
}
