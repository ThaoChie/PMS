import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between pb-4 border-b border-[#E5E5E7] mb-6 ${className}`}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#6B6B70] mb-1">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span>/</span>}
                <span>{b.label}</span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#6B6B70] mt-0.5">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}
