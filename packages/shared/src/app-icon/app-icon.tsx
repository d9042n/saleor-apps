import { Typography } from "@material-ui/core";
import { makeStyles } from "@saleor/macaw-ui";
import { HTMLProps, ReactNode } from "react";
import clsx from "clsx";

const useStyles = makeStyles({
  appIconContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "50%",
    color: "#fff",
    width: 50,
    height: 50,
  },
});

type Props = HTMLProps<HTMLDivElement> & {
  theme: string;
  text?: string;
  icon?: ReactNode;
};

export function AppIcon({ className, children, text, icon, theme, ...props }: Props) {
  const styles = useStyles();

  return (
    <div
      className={clsx(styles.appIconContainer, className)}
      style={{
        background: theme,
      }}
      {...props}
    >
      {text && <Typography variant="h2">{text}</Typography>}
      {icon && icon}
    </div>
  );
}