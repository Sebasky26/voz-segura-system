import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type BackButtonProps = {
  href: string;
  label?: string;
};

export function BackButton({ href, label = "Dashboard" }: BackButtonProps) {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
}
