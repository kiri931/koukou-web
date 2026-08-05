import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionHeading } from "./SectionHeading";

const meta = {
  title: "Site/SectionHeading",
  component: SectionHeading,
  args: {
    title: "まなぶ",
    desc: "生徒が自分で使う学習ツール",
  },
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 補足文なし */
export const TitleOnly: Story = {
  args: { desc: undefined },
};
