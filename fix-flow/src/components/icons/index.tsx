import type { ImgHTMLAttributes } from "react";
import catRoof from "../../assets/infographics/cat-roof.svg";
import catGarden from "../../assets/infographics/cat-garden.svg";
import catPlumbing from "../../assets/infographics/cat-plumbing.svg";
import catLockDoor from "../../assets/infographics/cat-lockdoor.svg";
import roleHomeowner from "../../assets/infographics/role-homeowner.svg";
import roleTradesperson from "../../assets/infographics/role-tradesperson.svg";
import roleAdmin from "../../assets/infographics/role-admin.svg";
import personHomeowner from "../../assets/infographics/person-homeowner.svg";
import personTradesperson from "../../assets/infographics/person-tradesperson.svg";
import statusSuccess from "../../assets/infographics/status-success.svg";
import statusStar from "../../assets/infographics/status-star.svg";
import statusFinding from "../../assets/infographics/status-finding.svg";

type IconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  size?: number;
  /** Kept for API compatibility with the previous line-icon star. */
  filled?: boolean;
};

function Infographic({
  src,
  alt,
  size = 24,
  className,
  filled: _filled,
  style,
  ...rest
}: IconProps & { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{ display: "inline-block", ...style }}
      {...rest}
    />
  );
}

/** Symbolic homeowner (house + search) */
export function IconHouse(props: IconProps) {
  return <Infographic src={roleHomeowner} alt="" {...props} />;
}

/** Symbolic tradesperson (hard hat + wrench) */
export function IconToolbox(props: IconProps) {
  return <Infographic src={roleTradesperson} alt="" {...props} />;
}

/** Person avatar: homeowner */
export function IconPersonHomeowner(props: IconProps) {
  return <Infographic src={personHomeowner} alt="" {...props} />;
}

/** Person avatar: tradesperson */
export function IconPersonTradesperson(props: IconProps) {
  return <Infographic src={personTradesperson} alt="" {...props} />;
}

/** Admin / clipboard */
export function IconClipboard(props: IconProps) {
  return <Infographic src={roleAdmin} alt="" {...props} />;
}

/** Success / checklist check */
export function IconCheckBadge(props: IconProps) {
  return <Infographic src={statusSuccess} alt="" {...props} />;
}

/** Star rating */
export function IconStar(props: IconProps) {
  const opacity = props.filled === false ? 0.35 : undefined;
  return (
    <Infographic
      src={statusStar}
      alt=""
      {...props}
      style={{ opacity, ...props.style }}
    />
  );
}

/** Roof / roofing */
export function IconRoof(props: IconProps) {
  return <Infographic src={catRoof} alt="" {...props} />;
}

/** Garden / leaf */
export function IconGarden(props: IconProps) {
  return <Infographic src={catGarden} alt="" {...props} />;
}

/** Plumbing / faucet */
export function IconPlumbing(props: IconProps) {
  return <Infographic src={catPlumbing} alt="" {...props} />;
}

/** Lock / door */
export function IconLockDoor(props: IconProps) {
  return <Infographic src={catLockDoor} alt="" {...props} />;
}

/** Finding pros / matching */
export function IconFinding(props: IconProps) {
  return <Infographic src={statusFinding} alt="" {...props} />;
}
