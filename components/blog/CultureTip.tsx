import { ReactNode } from 'react';

interface Props {
  title?: string;
  // Flag emoji for the target language (defaults to Polish for backward compatibility)
  flag?: string;
  children?: ReactNode;
}

export default function CultureTip({ title = "Cultural Tip", flag = "\u{1F1F5}\u{1F1F1}", children }: Props) {
  return (
    <div className="my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{flag}</span>
        <h4 className="font-bold text-amber-800 font-header">{title}</h4>
      </div>
      <div className="text-amber-900">
        {children}
      </div>
    </div>
  );
}
