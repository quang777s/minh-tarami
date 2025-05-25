import { Link, useLocation } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  FileText,
  Users,
  Image,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";

type AdminMenuProps = {
  t: {
    menu: {
      title: string;
      dashboard: string;
      posts: {
        title: string;
        all: string;
        create: string;
        categories: string;
        tags: string;
      };
      users: {
        title: string;
        all: string;
      };
      categories: {
        title: string;
        all: string;
        create: string;
      };
      media: {
        title: string;
        library: string;
        upload: string;
      };
    };
  };
};

export function AdminMenu({ t }: AdminMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const MenuContent = () => (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{t.menu.title}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMenu}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dashboard Link */}
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            className={cn(
              "justify-start w-full",
              location.pathname === "/admin/dashboard" && "bg-accent"
            )} 
            asChild
          >
            <Link to="/admin/dashboard">
              {t.menu.dashboard}
              <ChevronRight className="ml-auto h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Posts Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            <span>{t.menu.posts.title}</span>
          </div>
          <div className="grid gap-2 pl-7">
            <Button 
              variant="ghost" 
              className={cn(
                "justify-start w-full",
                location.pathname === "/admin/posts" && "bg-accent"
              )} 
              asChild
            >
              <Link to="/admin/posts">
                {t.menu.posts.all}
                <ChevronRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "justify-start w-full",
                location.pathname === "/admin/posts/create" && "bg-accent"
              )} 
              asChild
            >
              <Link to="/admin/posts/create">
                {t.menu.posts.create}
                <ChevronRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Users Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5" />
            <span>{t.menu.users.title}</span>
          </div>
          <div className="grid gap-2 pl-7">
            <Button 
              variant="ghost" 
              className={cn(
                "justify-start w-full",
                location.pathname === "/admin/users" && "bg-accent"
              )} 
              asChild
            >
              <Link to="/admin/users">
                {t.menu.users.all}
                <ChevronRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Categories Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            <span>{t.menu.categories.title}</span>
          </div>
          <div className="grid gap-2 pl-7">
            <Button 
              variant="ghost" 
              className={cn(
                "justify-start w-full",
                location.pathname === "/admin/categories" && "bg-accent"
              )} 
              asChild
            >
              <Link to="/admin/categories">
                {t.menu.categories.all}
                <ChevronRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "justify-start w-full",
                location.pathname === "/admin/categories/create" && "bg-accent"
              )} 
              asChild
            >
              <Link to="/admin/categories/create">
                {t.menu.categories.create}
                <ChevronRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Media Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Image className="h-5 w-5" />
            <span>{t.menu.media.title}</span>
          </div>
          <div className="grid gap-2 pl-7">
            <Button 
              variant="ghost" 
              className={cn(
                "justify-start w-full",
                location.pathname === "/admin/media" && "bg-accent"
              )} 
              asChild
            >
              <Link to="/admin/media">
                {t.menu.media.library}
                <ChevronRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "justify-start w-full",
                location.pathname === "/admin/media/upload" && "bg-accent"
              )} 
              asChild
            >
              <Link to="/admin/media/upload">
                {t.menu.media.upload}
                <ChevronRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 md:hidden"
        onClick={toggleMenu}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Desktop Menu */}
      <div className="hidden md:block">
        <MenuContent />
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={toggleMenu}
      >
        <div
          className={cn(
            "fixed inset-y-0 left-0 w-[300px] bg-background p-4 shadow-lg transition-transform duration-200 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuContent />
        </div>
      </div>
    </>
  );
} 