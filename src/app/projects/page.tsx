import { redirect } from "next/navigation";

/** Work and projects are one page now. Old links still land. */
export default function ProjectsAlias() {
  redirect("/");
}
