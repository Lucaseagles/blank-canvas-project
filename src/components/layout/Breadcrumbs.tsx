import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbsProps {
  items: {
    label: string;
    to?: string;
    params?: any;
  }[];
}

export function CustomBreadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <Breadcrumb className="mb-8">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-1 font-black uppercase tracking-widest text-[11px] hover:text-primary transition-colors">
              <Home className="w-3.5 h-3.5 mb-0.5" />
              Base
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <React.Fragment key={index}>
              <BreadcrumbSeparator>
                <ChevronRight className="w-3.5 h-3.5 opacity-30" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast || !item.to ? (
                  <BreadcrumbPage className="font-black uppercase tracking-widest text-[11px] text-primary truncate max-w-[150px] md:max-w-none">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link 
                      to={item.to as any} 
                      params={item.params}
                      className="font-black uppercase tracking-widest text-[11px] hover:text-primary transition-colors truncate max-w-[100px] md:max-w-none"
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

import * as React from "react";
