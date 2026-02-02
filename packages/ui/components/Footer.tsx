interface FooterProps {
  year?: number;
}

export default function Footer({ year = new Date().getFullYear() }: FooterProps) {
  return (
    <footer className="bg-gray-100 mt-16 py-8">
      <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
        <p>&copy; {year} NHS England. All rights reserved.</p>
      </div>
    </footer>
  );
}
