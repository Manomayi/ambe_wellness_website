import Link from 'next/link';
import { HomeIcon, ChatBubbleLeftEllipsisIcon,
         ShoppingCartIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function UserNav({ currentPath }) {
  const tabs = [
    { label: 'Home',    href: '/user/home',    Icon: HomeIcon },
    { label: 'Consult', href: '/user/consult', Icon: ChatBubbleLeftEllipsisIcon },
    { label: 'Store',   href: '/user/store',   Icon: ShoppingCartIcon },
    { label: 'Menu',    href: '/user/menu',    Icon: UserCircleIcon },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-sm border-b border-[#E7E2D9] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
        <div className="text-2xl font-bold text-[#1A1A1A]">Ambe</div>
        <nav className="flex space-x-6">
          {tabs.map(({ label, href, Icon }) => {
            const isActive = currentPath === href || currentPath.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center space-x-1 px-2 py-1 rounded-md transition ${
                  isActive
                    ? 'text-[#1A1A1A] font-semibold'
                    : 'text-[#6B6862] hover:text-[#1A1A1A]'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? 'text-[#1A1A1A]'
                      : 'text-[#8C827A] group-hover:text-[#1A1A1A]'
                  }`}
                />
                <span className="text-sm font-medium">
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 mx-auto h-0.5 w-6 bg-[#C8996A]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
