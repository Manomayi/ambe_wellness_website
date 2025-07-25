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
    <header className="sticky top-0 z-50 bg-white bg-opacity-90 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
        <div className="text-2xl font-bold text-green-600">Ambe</div>
        <nav className="flex space-x-6">
          {tabs.map(({ label, href, Icon }) => {
            const isActive = currentPath === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center space-x-1 px-2 py-1 rounded-md transition ${
                  isActive
                    ? 'text-green-600'
                    : 'text-gray-600 hover:text-green-500'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? 'text-green-600'
                      : 'text-gray-400 group-hover:text-green-500'
                  }`}
                />
                <span className="text-sm font-medium">
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 mx-auto h-0.5 w-6 bg-green-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
