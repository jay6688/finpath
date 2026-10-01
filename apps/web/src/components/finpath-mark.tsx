type FinPathMarkProps = {
  className?: string;
};

export function FinPathMark({ className }: FinPathMarkProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 32 32">
      <path d="M5.5 17.7C5.5 9.9 10.5 4.9 19 4c-.1 8.1-5 13-13.5 13.7Z" />
      <path d="M12 28c0-8.2 5-13.2 14.5-14.1-.2 8.2-5.2 13.2-14.5 14.1Z" />
    </svg>
  );
}
