import { buildEnv, serverEnv } from "@cap/env";
import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import type { JSXElementConstructor, ReactElement } from "react";
import { Resend } from "resend";

export const resend = () =>
	serverEnv().RESEND_API_KEY ? new Resend(serverEnv().RESEND_API_KEY) : null;

export const smtp = () => {
	const env = serverEnv();
	if (!env.SMTP_HOST) return null;
	return nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: parseInt(env.SMTP_PORT || "587"),
		secure: env.SMTP_PORT === "465",
		auth: {
			user: env.SMTP_USER,
			pass: env.SMTP_PASSWORD,
		},
	});
};

export const sendEmail = async ({
	email,
	subject,
	react,
	marketing,
	test,
	scheduledAt,
	cc,
	replyTo,
	fromOverride,
}: {
	email: string;
	subject: string;
	react: ReactElement<unknown, string | JSXElementConstructor<unknown>>;
	marketing?: boolean;
	test?: boolean;
	scheduledAt?: string;
	cc?: string | string[];
	replyTo?: string;
	fromOverride?: string;
}) => {
	const r = resend();
	if (r) {
		if (marketing && !buildEnv.NEXT_PUBLIC_IS_CAP) return;
		let from: string;

		if (fromOverride) from = fromOverride;
		else if (marketing) from = "Richie from Cap <richie@send.cap.so>";
		else if (buildEnv.NEXT_PUBLIC_IS_CAP)
			from = "Cap Auth <no-reply@auth.cap.so>";
		else from = `auth@${serverEnv().RESEND_FROM_DOMAIN}`;

		return r.emails.send({
			from,
			to: test ? "delivered@resend.dev" : email,
			subject,
			react,
			scheduledAt,
			cc: test ? undefined : cc,
			replyTo: replyTo,
		});
	}

	const transporter = smtp();
	if (transporter) {
		const html = await render(react);
		const from = fromOverride || serverEnv().SMTP_FROM || serverEnv().SMTP_USER;

		return transporter.sendMail({
			from,
			to: email,
			subject,
			html,
			cc,
			replyTo,
		});
	}

	return Promise.resolve();
};
