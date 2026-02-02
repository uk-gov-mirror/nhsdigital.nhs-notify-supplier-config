import Link from "next/link";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({
  title = "NHS Notify",
  subtitle = "Supplier Configuration Management"
}: HeaderProps) {
  return (
    <header className="bg-[#005EB8] text-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-lg mt-2">{subtitle}</p>
        </Link>
      </div>
    </header>
  );
}
