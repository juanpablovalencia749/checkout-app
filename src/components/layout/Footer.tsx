import React from "react";


interface LinkItem {
  label: string;
  href: string;
}

interface FooterProps {
  companyName?: string;
  gatewayName?: string;
  links?: LinkItem[];
}


export const Footer: React.FC<FooterProps> = ({
  companyName = "Checkout Store",
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground shadow">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">{companyName}</p>
                <p className="text-xs text-muted-foreground">
                  Secure payments · Fast checkout
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground/60">
          © {currentYear} {companyName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

