import { inngest } from "../client.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";

export const onUserSignup = inngest.createFunction(
  { id: "on-user-signup", retries: 2 },
  { event: "user/signup" },
  async ({ event, step }) => {
    try {
      const { email } = event.data;
      await step.run("get-user-email", async () => {
        const UserObject = await User.findOne({ email });
        if (!UserObject) {
          throw new NonRetriableError("User no longer exists in our database");
        }
        return UserObject;
      });

      // send email logic here
      await step.run("send-welcome-email", async () => {
        const subject = `Welcome to the app`;
        const message = `Hi,
        \n\n
        Thanks for signing up. We're glad to have you onboard!
        `;

        await sendMail(UserObject.email, subject, message);
      });
      return { success: true };
    } catch (error) {
      console.error("❌ Error in onUserSignup", error.message);
      return { success: false };
    }
  },
);
