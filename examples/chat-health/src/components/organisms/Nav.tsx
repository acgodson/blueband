"use client";
import Link from "next/link";

const Nav = () => {
  return (
    <div className="flex fixed top-0 w-full justify-between items-center px-6 py-1 border-b backdrop-blur-md">
      <div className="flex items-center gap-8">
        <Link href={"/"}>
          <img width={50} height={50} src="/icon.png" alt="highfeast logo" />
        </Link>
      </div>
    </div>
  );
};

export default Nav;
