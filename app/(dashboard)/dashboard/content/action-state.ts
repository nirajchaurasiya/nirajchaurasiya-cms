export type ContentActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialContentActionState: ContentActionState = {
  status: "idle",
  message: "",
};