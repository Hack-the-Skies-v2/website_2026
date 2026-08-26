import Link from "next/link";
import ParallaxLayer from "@/components/ParallaxLayer";

export default function Terms() {
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
                    Terms of Service
                </h1>

                <div className="space-y-8 text-primary/90 font-outfit leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            1. Eligibility
                        </h2>
                        <p>
                            Hack the Skies is a hackathon exclusively for high school students. Participants
                            must be currently enrolled in an accredited high school to be eligible to attend.
                            Participants may be minors or of legal age. If you are a minor, parent or guardian
                            consent is required for participation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            2. Participant Responsibilities
                        </h2>
                        <p>
                            As a participant, you agree to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-3">
                            <li>Provide accurate and truthful information in your application</li>
                            <li>Comply with all event rules and guidelines</li>
                            <li>Respect other participants, organizers, and venues</li>
                            <li>Follow the Code of Conduct outlined in Section 5</li>
                            <li>Notify organizers of any accessibility needs or health concerns</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            3. Application and Acceptance
                        </h2>
                        <p>
                            Submitting an application does not guarantee acceptance to Hack the Skies.
                            Applicants will be notified of their acceptance status via email. The organizers
                            reserve the right to accept or reject any application at their discretion.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            4. Event Rules
                        </h2>
                        <p>
                            Participants must:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-3">
                            <li>Arrive on time and attend all required events and activities</li>
                            <li>Refrain from disruptive behavior</li>
                            <li>Not bring weapons, drugs, alcohol, or other prohibited substances</li>
                            <li>Not engage in harassment, discrimination, or bullying</li>
                            <li>Follow venue-specific rules and safety protocols</li>
                            <li>Participate constructively in team activities</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            5. Code of Conduct
                        </h2>
                        <p>
                            Hack the Skies is committed to creating an inclusive and welcoming environment.
                            All participants agree to treat each other with respect and kindness. We do not
                            tolerate discrimination based on race, ethnicity, gender, gender identity, sexual
                            orientation, religion, disability, age, or any other characteristic. Any form of
                            harassment or hateful speech is strictly prohibited.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            6. Prohibited Behavior
                        </h2>
                        <p>
                            The following behaviors are strictly prohibited and may result in immediate
                            removal from the event:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-3">
                            <li>Harassment, bullying, or discrimination of any kind</li>
                            <li>Violence or threats of violence</li>
                            <li>Illegal activities or possession of prohibited substances</li>
                            <li>Plagiarism or academic dishonesty in projects</li>
                            <li>Unauthorized access to computer systems</li>
                            <li>Recording or photographing other participants without consent</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            7. Project Ownership and Intellectual Property
                        </h2>
                        <p>
                            You retain ownership of the code and projects you create during Hack the Skies.
                            By submitting your project, you grant Hack the Skies permission to showcase, display,
                            and discuss your work for promotional purposes. The organizers may use project names,
                            descriptions, and code snippets (with appropriate attribution) on the website and in
                            marketing materials. You remain free to use your code for any purpose after the event.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            8. Event Changes and Cancellation
                        </h2>
                        <p>
                            Hack the Skies reserves the right to modify, postpone, or cancel the event at any time
                            due to unforeseen circumstances such as weather, health emergencies, or safety concerns.
                            In the event of cancellation, participants will be notified as soon as possible via email.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            9. Removal from the Event
                        </h2>
                        <p>
                            Participants who violate the Code of Conduct or event rules may be asked to leave
                            immediately without a refund. Serious violations may result in being banned from future
                            Hack the Skies events.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            10. Safety
                        </h2>
                        <p>
                            While Hack the Skies takes reasonable precautions to ensure participant safety, we are
                            not responsible for lost, stolen, or damaged personal items. Participants assume all risk
                            for injury or illness during the event, except where prohibited by law. Participants with
                            medical conditions or special needs should inform organizers upon application or arrival.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            11. Changes to These Terms
                        </h2>
                        <p>
                            Hack the Skies may update these Terms of Service at any time. Participants will be
                            notified of significant changes. Continued participation in the event constitutes
                            acceptance of any updates.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            12. Contact Information
                        </h2>
                        <p>
                            For questions about these Terms of Service, please contact us at{" "}
                            <span className="text-yellow-300">hello@hacktheskies.com</span>
                        </p>
                    </section>

                    <section>
                        <p className="text-sm text-primary/60 italic mt-12 pt-8 border-t border-primary/20">
                            These Terms of Service are provided as a template for organizers. Organizations
                            should review and customize these terms with legal counsel before final implementation.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
