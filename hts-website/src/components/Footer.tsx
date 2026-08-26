import Link from "next/link";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#0a0611] border-t border-primary/20 text-primary py-12">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div>
                        <h3 className="font-outfit text-xl font-semibold mb-4">
                            Hack the Skies
                        </h3>
                        <p className="font-outfit text-sm text-primary/70">
                            A hackathon founded by high school students, for high school students.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-outfit font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2 font-outfit text-sm">
                            <li>
                                <Link
                                    href="/"
                                    className="hover:text-primary/80 transition-colors"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/apply"
                                    className="hover:text-primary/80 transition-colors"
                                >
                                    Apply
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-outfit font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 font-outfit text-sm">
                            <li>
                                <Link
                                    href="/terms"
                                    className="hover:text-primary/80 transition-colors"
                                >
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy"
                                    className="hover:text-primary/80 transition-colors"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-primary/20 pt-8 text-center">
                    <p className="font-outfit text-sm text-primary/60">
                        © {currentYear} Hack the Skies. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
