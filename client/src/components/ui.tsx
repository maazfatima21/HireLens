import type { ReactNode } from "react";
export const Button = (p: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button className="button" {...p}/>;
export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => <article className={`card ${className}`.trim()}>{children}</article>;
export const Badge = ({ children }: { children: ReactNode }) => <span className="badge">{children}</span>;
export const Loading = () => <p className="muted">Loading...</p>;
export const Empty = ({ text = "Nothing here yet" }) => <p className="muted">{text}</p>;
