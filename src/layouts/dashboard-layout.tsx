import { Fragment } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { AppSidebar } from "@/components/app-sidebar"
import { ThemeSwitcher } from "@/app/themes/theme-switcher"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { modules, sidebarGroups } from "@/navigation/modules"

interface Crumb {
  label: string
  to?: string
}

function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation()

  if (pathname === "/" || pathname === "") {
    return [{ label: "Dashboard" }]
  }

  const match = modules.find(
    (m) => m.path !== "/" && (pathname === m.path || pathname.startsWith(`${m.path}/`))
  )

  if (!match) return [{ label: "Dashboard" }]

  const crumbs: Crumb[] = [{ label: "Dashboard", to: "/" }]
  if (match.group && sidebarGroups[match.group]) {
    crumbs.push({ label: sidebarGroups[match.group].label })
  }
  crumbs.push({ label: match.label })
  return crumbs
}

export default function DashboardLayout() {
  const crumbs = useBreadcrumbs()

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 items-center border-b px-4">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="mx-4 data-[orientation=vertical]:h-[0]"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Chapter Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {crumbs.map((crumb, idx) => {
                const isLast = idx === crumbs.length - 1
                return (
                  <Fragment key={`${crumb.label}-${idx}`}>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      {isLast || !crumb.to ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.to}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
          <ThemeSwitcher />
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
