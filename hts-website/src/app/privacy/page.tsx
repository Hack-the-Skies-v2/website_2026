import Link from "next/link";
import ParallaxLayer from "@/components/ParallaxLayer";

export default function Privacy() {
    return (
        <main className="bg-[#141123] text-white min-h-screen">
            <Link href="/">
                <button
                    type="button"
                    className="
						fixed top-4 right-4 z-50
						rounded-full
						bg-button
						px-6 py-2
						font-outfit
						text-base text-white
						shadow-[0_0_20px_rgba(130,104,180,0.45)]
						transition-all duration-150
						md:px-8 md:py-3 md:text-lg
						hover:bg-[#8268B4]
						hover:scale-105
						cursor-pointer
					"
                >
                    Return to Home
                </button>
            </Link>

            <ParallaxLayer
                speed={0.4}
                className="
					pointer-events-none
					absolute
					top-[-150px]
					left-1/2
					w-[1000px]
					-translate-x-1/2
					opacity-30
					blur-[1px]
					cloud-drift
					select-none
				"
            >
                <img src="/Cloud1.webp" alt="" className="h-full w-full" />
            </ParallaxLayer>

            <div className="max-w-4xl mx-auto px-6 py-24">
                <h1 className="text-5xl md:text-6xl font-outfit font-semibold text-primary mb-12 text-center">
                    Privacy Policy
                </h1>

                <div className="space-y-8 text-primary/90 font-outfit leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            1. Introduction
                        </h2>
                        <p>
                            Hack the Skies ("we," "our," or "us") is committed to protecting the privacy of our
                            participants. This Privacy Policy explains what information we collect, how we use it,
                            and how we protect your privacy. Because many of our participants may be under 18,
                            we take extra care in our data handling practices.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            2. What Information We Collect
                        </h2>
                        <p>
                            We collect information that you voluntarily provide through our application form and
                            during the event. This includes:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-3">
                            <li>
                                <strong>Personal Information:</strong> First name, last name, preferred name, email
                                address, phone number, and date of birth
                            </li>
                            <li>
                                <strong>School Information:</strong> School name, grade level, expected graduation
                                year, and school city
                            </li>
                            <li>
                                <strong>Preferences and Accommodations:</strong> T-shirt size, dietary restrictions,
                                and accessibility accommodations
                            </li>
                            <li>
                                <strong>Parent/Guardian Information:</strong> Name, email address, and phone number
                                (required for participants under 18)
                            </li>
                            <li>
                                <strong>Emergency Contact Information:</strong> Contact name, phone number, and
                                relationship to participant
                            </li>
                            <li>
                                <strong>Application Responses:</strong> Your written answer to the application question
                            </li>
                            <li>
                                <strong>Event Data:</strong> Attendance records, team assignments (if applicable),
                                project information, and any photos/videos taken during the event
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            3. Why We Collect This Information
                        </h2>
                        <p>
                            We collect this information for the following purposes:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-3">
                            <li>To process and review your application</li>
                            <li>To communicate with you about your participation status and event details</li>
                            <li>To accommodate your dietary restrictions and accessibility needs</li>
                            <li>To contact your parent/guardian as required for minors</li>
                            <li>To provide emergency services if needed</li>
                            <li>To organize and run the hackathon event</li>
                            <li>To evaluate participant demographics and improve future events</li>
                            <li>To share project results and participant achievements</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            4. How We Use Your Information
                        </h2>
                        <p>
                            Your information is used to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-3">
                            <li>Review and process your application</li>
                            <li>Send you event updates and important information</li>
                            <li>Arrange accommodations for dietary restrictions and accessibility needs</li>
                            <li>Contact your parent/guardian with event-related information</li>
                            <li>Handle emergency situations if necessary</li>
                            <li>Verify your eligibility as a high school student</li>
                            <li>Track attendance and participation metrics</li>
                            <li>Showcase projects and acknowledge participants (with appropriate consent)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            5. Who Has Access to Your Information
                        </h2>
                        <p>
                            Your information is only accessible to Hack the Skies organizers and staff who need
                            it to fulfill the purposes outlined above. We do not sell your personal information
                            to third parties. Your information may be shared with:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-3">
                            <li>Event organizers and staff</li>
                            <li>Volunteers assisting with registration, accommodations, or emergency response</li>
                            <li>Venues or facilities hosting the event</li>
                            <li>Parent/guardians (for minor participants)</li>
                            <li>Emergency responders if necessary</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            6. Data Protection
                        </h2>
                        <p>
                            We take reasonable technical and organizational measures to protect your personal
                            information from unauthorized access, alteration, disclosure, or destruction. However,
                            no method of transmission over the internet is completely secure. We encourage you to
                            contact us if you have concerns about the security of your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            7. Data Retention
                        </h2>
                        <p>
                            We retain your personal information for as long as necessary to fulfill the purposes
                            for which it was collected. Generally, we retain application information for one year
                            after the event. Project information may be retained longer if you have agreed to have
                            your work showcased. You may request deletion of your information at any time by
                            contacting us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            8. Your Rights
                        </h2>
                        <p>
                            You have the right to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-3">
                            <li>Request a copy of the personal information we hold about you</li>
                            <li>Request correction of inaccurate or incomplete information</li>
                            <li>Request deletion of your personal information</li>
                            <li>Request that we limit how we use your information</li>
                            <li>Withdraw consent at any time (for minors, parents/guardians can make these requests)</li>
                        </ul>
                        <p className="mt-3">
                            To exercise any of these rights, please contact us at the email address below.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            9. Consent for Minors
                        </h2>
                        <p>
                            Because many Hack the Skies participants are minors (under 18), we require parental or
                            guardian consent for collecting and processing their personal information. Parents and
                            guardians have the right to review, update, or delete their child's information at any
                            time by contacting us directly.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            10. Photos and Videos
                        </h2>
                        <p>
                            Hack the Skies may take photos or videos during the event for documentation, promotion,
                            or social media purposes. By participating, you grant us permission to use these images
                            for promotional purposes. If you prefer not to have your image used, please inform an
                            organizer before the event begins. For minors, parental consent is required.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            11. Third-Party Services
                        </h2>
                        <p>
                            We may use third-party services for email communication, data storage, or other
                            operational purposes. These service providers are bound by confidentiality agreements
                            and are prohibited from using your information for any purpose other than providing
                            services to us. We only use reputable, secure service providers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            12. Contact Us
                        </h2>
                        <p>
                            If you have questions about this Privacy Policy, would like to access or delete your
                            information, or have privacy concerns, please contact us at: {" "}<span className="text-yellow-300">hello@hacktheskies.com</span>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            13. Changes to This Policy
                        </h2>
                        <p>
                            Hack the Skies may update this Privacy Policy at any time to reflect changes in our
                            practices or legal requirements. We will notify participants of significant changes via
                            email. Your continued participation in our events constitutes acceptance of any updates
                            to this policy.
                        </p>
                    </section>

                    <section>
                        <p className="text-sm text-primary/60 italic mt-12 pt-8 border-t border-primary/20">
                            This Privacy Policy is provided as a template for organizers. Organizations should
                            review and customize this policy with legal counsel before final implementation.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
