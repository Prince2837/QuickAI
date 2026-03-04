import React from "react";
import { NavLink } from "react-router-dom";
import { Protect, useClerk, useUser } from "@clerk/clerk-react";
import {
  Eraser,
  FileText,
  Hash,
  House,
  Image,
  Scissors,
  SquarePen,
  Users,
  LogOut,
} from "lucide-react";

const navItems = [
  { to: "/ai", label: "Dashboard", Icon: House },
  { to: "/ai/write-article", label: "Write Article", Icon: SquarePen },
  { to: "/ai/blog-titles", label: "Blog Titles", Icon: Hash },
  { to: "/ai/generate-images", label: "Generate Images", Icon: Image },
  { to: "/ai/remove-background", label: "Remove Background", Icon: Eraser },
  { to: "/ai/remove-object", label: "Remove Object", Icon: Scissors },
  { to: "/ai/review-resume", label: "Review Resume", Icon: FileText },
  { to: "/ai/community", label: "Community", Icon: Users },
];

const Sidebar = ({ sidebar, setSidebar }) => {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();

  if (!isLoaded) return null;

  return (
    <div
      className={`w-60 bg-white border-r border-gray-200 flex flex-col
      max-sm:absolute top-14 bottom-0
      ${sidebar ? "translate-x-0" : "max-sm:-translate-x-full"}
      transition-all duration-300 ease-in-out`}
    >
      {/* Profile Top */}
      <div className="mt-4 mb-3 w-full text-center">
        <img
          src={user?.imageUrl}
          alt="profile"
          className="mt-8 w-12 rounded-full mx-auto"
        />

        <h1 className="mt-1 text-sm font-medium">
          {user?.fullName}
        </h1>
      </div>

      {/* Menu */}
      <div className="px-6 mt-5 text-sm flex flex-col gap-1 w-full text-gray-600 font-medium">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/ai"}
            onClick={() => setSidebar(false)}
            className={({ isActive }) =>
              `px-3 py-2 flex items-center gap-3 rounded-md text-sm transition
              ${isActive
                ? "bg-gradient-to-r from-[#3C81F6] to-[#9234EA] text-white"
                : "hover:bg-gray-100"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-white" : ""
                    }`}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom Profile + Plan */}
      <div className="mt-auto w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between">
        <div
          onClick={openUserProfile}
          className="flex gap-2 items-center cursor-pointer"
        >
          <img
            src={user?.imageUrl}
            className="w-8 rounded-full"
            alt=""
          />

          <div>
            <h1 className="text-sm font-medium">
              {user?.fullName}
            </h1>

            <p className="text-xs text-gray-500">
              <Protect plan="premium" fallback='free' >Premium  </Protect>
              Plan
            </p>
          </div>
        </div>

        <LogOut
          onClick={signOut}
          className="w-4.5 text-gray-400 hover:text-gray-700 transition cursor-pointer"
        />
      </div>
    </div>
  );
};

export default Sidebar;