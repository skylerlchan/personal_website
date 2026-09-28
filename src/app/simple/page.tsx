import { redirect } from "next/navigation";

/** The old prototype URL. The list it showed now lives at /projects. */
export default function SimpleAlias() {
  redirect("/projects");
}
