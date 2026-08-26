"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ParallaxLayer from "@/components/ParallaxLayer";

const STORAGE_KEY = "hts_application_draft";
const AUTO_SAVE_DELAY = 1000;

const CANADIAN_PROVINCES = [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
];

interface ApplicationData {
    section1: {
        firstName: string;
        lastName: string;
        preferredName: string;
        email: string;
        phoneNumber: string;
        dateOfBirth: string;
        tShirtSize: string;
        city: string;
        province: string;
        dietaryRestrictions: string[];
        dietaryOther: string;
        accessibilityAccommodations: string[];
        accessibilityOther: string;
    };
    section2: {
        schoolName: string;
        grade: string;
        graduationYear: string;
        schoolCity: string;
        enrolledInHighSchool: string;
    };
    section3: {
        parentName: string;
        parentEmail: string;
        parentPhone: string;
        emergencyContactName: string;
        emergencyContactPhone: string;
        emergencyContactRelationship: string;
        emergencyContactRelationshipOther: string;
    };
    section4: {
        hackathonExperience: string;
        heardAboutHTS: string;
        heardAboutHTSOther: string;
    };
    section5: {
        applicationQuestion: string;
    };
    section6: {
        eligibilityConfirm: boolean;
        informationConfirm: boolean;
        parentalConfirm: boolean;
        termsAgreed: boolean;
    };
}

const EMPTY_DATA: ApplicationData = {
    section1: {
        firstName: "",
        lastName: "",
        preferredName: "",
        email: "",
        phoneNumber: "",
        dateOfBirth: "",
        tShirtSize: "",
        city: "",
        province: "",
        dietaryRestrictions: [],
        dietaryOther: "",
        accessibilityAccommodations: [],
        accessibilityOther: "",
    },
    section2: {
        schoolName: "",
        grade: "",
        graduationYear: "",
        schoolCity: "",
        enrolledInHighSchool: "",
    },
    section3: {
        parentName: "",
        parentEmail: "",
        parentPhone: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
        emergencyContactRelationshipOther: "",
    },
    section4: {
        hackathonExperience: "",
        heardAboutHTS: "",
        heardAboutHTSOther: "",
    },
    section5: {
        applicationQuestion: "",
    },
    section6: {
        eligibilityConfirm: false,
        informationConfirm: false,
        parentalConfirm: false,
        termsAgreed: false,
    },
};

function saveApplicationDraft(data: ApplicationData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save draft:", e);
    }
}

function loadApplicationDraft(): ApplicationData {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error("Failed to load draft:", e);
    }
    return EMPTY_DATA;
}

function clearApplicationDraft() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error("Failed to clear draft:", e);
    }
}

export default function ApplicationForm() {
    const [currentSection, setCurrentSection] = useState(1);
    const [data, setData] = useState<ApplicationData>(EMPTY_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "">("");
    const [submitted, setSubmitted] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // TODO at the beginning add an option to choose between mentor, judge, and hacker, although mentor and judge might become the same thing

    useEffect(() => {
        const loaded = loadApplicationDraft();
        setData(loaded);
    }, []);

    const debouncedSave = useCallback((newData: ApplicationData) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        setSaveStatus("saving");

        saveTimeoutRef.current = setTimeout(() => {
            saveApplicationDraft(newData);
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus(""), 2000);
        }, AUTO_SAVE_DELAY);
    }, []);

    const updateData = useCallback(
        (updates: Partial<ApplicationData>) => {
            const newData = { ...data, ...updates };
            setData(newData);
            debouncedSave(newData);
        },
        [data, debouncedSave]
    );

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePhone = (phone: string) => {
        return /^\d{10}|^\+?\d{1,3}[-.\s]?\d{1,14}$/.test(phone.replace(/\D/g, ""));
    };

    const validateSection1 = () => {
        const newErrors: Record<string, string> = {};
        if (!data.section1.firstName.trim())
            newErrors.firstName = "Please enter your first name.";
        if (!data.section1.lastName.trim())
            newErrors.lastName = "Please enter your last name.";
        if (!data.section1.email.trim())
            newErrors.email = "Please enter your email address.";
        else if (!validateEmail(data.section1.email))
            newErrors.email = "Please enter a valid email address.";
        if (!data.section1.phoneNumber.trim())
            newErrors.phoneNumber = "Please enter your phone number.";
        else if (!validatePhone(data.section1.phoneNumber))
            newErrors.phoneNumber = "Please enter a valid phone number.";
        if (!data.section1.dateOfBirth)
            newErrors.dateOfBirth = "Please select your date of birth.";
        if (!data.section1.tShirtSize)
            newErrors.tShirtSize = "Please select your t-shirt size.";
        if (!data.section1.city.trim()) newErrors.city = "Please enter your city.";
        if (!data.section1.province)
            newErrors.province = "Please select your province.";
        if (data.section1.dietaryRestrictions.length === 0)
            newErrors.dietaryRestrictions = "Please select dietary restrictions.";
        if (
            data.section1.dietaryRestrictions.includes("Other") &&
            !data.section1.dietaryOther.trim()
        )
            newErrors.dietaryOther = "Please specify your dietary restrictions.";
        if (data.section1.accessibilityAccommodations.length === 0)
            newErrors.accessibilityAccommodations =
                "Please select accessibility options.";
        if (
            data.section1.accessibilityAccommodations.includes("Other") &&
            !data.section1.accessibilityOther.trim()
        )
            newErrors.accessibilityOther =
                "Please describe your accessibility needs.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection2 = () => {
        const newErrors: Record<string, string> = {};
        if (!data.section2.schoolName.trim())
            newErrors.schoolName = "Please enter your school name.";
        if (!data.section2.grade) newErrors.grade = "Please select your grade.";
        if (!data.section2.graduationYear)
            newErrors.graduationYear = "Please select your graduation year.";
        if (!data.section2.schoolCity.trim())
            newErrors.schoolCity = "Please enter your school city.";
        if (!data.section2.enrolledInHighSchool)
            newErrors.enrolledInHighSchool = "Please answer this question.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection3 = () => {
        const newErrors: Record<string, string> = {};
        if (!data.section3.parentName.trim())
            newErrors.parentName = "Please enter your parent/guardian's name.";
        if (!data.section3.parentEmail.trim())
            newErrors.parentEmail =
                "Please enter your parent/guardian's email address.";
        else if (!validateEmail(data.section3.parentEmail))
            newErrors.parentEmail = "Please enter a valid email address.";
        if (!data.section3.parentPhone.trim())
            newErrors.parentPhone =
                "Please enter your parent/guardian's phone number.";
        else if (!validatePhone(data.section3.parentPhone))
            newErrors.parentPhone = "Please enter a valid phone number.";
        if (!data.section3.emergencyContactName.trim())
            newErrors.emergencyContactName =
                "Please enter your emergency contact's name.";
        if (!data.section3.emergencyContactPhone.trim())
            newErrors.emergencyContactPhone =
                "Please enter your emergency contact's phone number.";
        else if (!validatePhone(data.section3.emergencyContactPhone))
            newErrors.emergencyContactPhone = "Please enter a valid phone number.";
        if (!data.section3.emergencyContactRelationship)
            newErrors.emergencyContactRelationship =
                "Please select the relationship.";
        if (
            data.section3.emergencyContactRelationship === "Other" &&
            !data.section3.emergencyContactRelationshipOther.trim()
        )
            newErrors.emergencyContactRelationshipOther =
                "Please specify the relationship.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection4 = () => {
        const newErrors: Record<string, string> = {};
        if (!data.section4.hackathonExperience)
            newErrors.hackathonExperience = "Please select an option.";
        if (!data.section4.heardAboutHTS)
            newErrors.heardAboutHTS = "Please select how you heard about us.";
        if (
            data.section4.heardAboutHTS === "Other" &&
            !data.section4.heardAboutHTSOther.trim()
        )
            newErrors.heardAboutHTSOther = "Please specify.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection5 = () => {
        const newErrors: Record<string, string> = {};
        const wordCount = data.section5.applicationQuestion
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0).length;

        if (!data.section5.applicationQuestion.trim())
            newErrors.applicationQuestion = "Please answer the question.";
        if (wordCount > 300)
            newErrors.applicationQuestion =
                "Your answer exceeds 300 words.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection6 = () => {
        const newErrors: Record<string, string> = {};
        if (!data.section6.eligibilityConfirm)
            newErrors.eligibilityConfirm = "Please confirm eligibility.";
        if (!data.section6.informationConfirm)
            newErrors.informationConfirm =
                "Please confirm information accuracy.";
        if (!data.section6.parentalConfirm)
            newErrors.parentalConfirm = "Please confirm understanding.";
        if (!data.section6.termsAgreed)
            newErrors.termsAgreed = "Please agree to the Terms of Service and Privacy Policy.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = () => {
        let isValid = false;
        switch (currentSection) {
            case 1:
                isValid = validateSection1();
                break;
            case 2:
                isValid = validateSection2();
                break;
            case 3:
                isValid = validateSection3();
                break;
            case 4:
                isValid = validateSection4();
                break;
            case 5:
                isValid = validateSection5();
                break;
            default:
                isValid = true;
        }

        if (isValid) {
            if (currentSection < 6) {
                setCurrentSection(currentSection + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        }
    };

    const handleBack = () => {
        if (currentSection > 1) {
            setCurrentSection(currentSection - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleSaveContinueLater = () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveApplicationDraft(data);
        setSaveStatus("saved");
    };

    const handleSubmit = () => {
        if (validateSection6()) {
            setSubmitted(true);
            saveApplicationDraft(data);
        }
    };

    const handleEditSection = (section: number) => {
        setCurrentSection(section);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const getProgress = () => {
        if (submitted) return 100;
        return Math.round(((currentSection - 1) / 6) * 100);
    };

    const wordCount = data.section5.applicationQuestion
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;

    if (submitted) {
        return (
            <section className="min-h-screen bg-[#141123] text-white flex items-center justify-center px-6 py-12">
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
                <ParallaxLayer
                    speed={0.35}
                    className="
						pointer-events-none
						absolute
						left-4
						top-20
						w-24
						md:left-12
						md:top-32
						md:w-36
						opacity-70
						magenta-planet-glow
						select-none
						planet-float-delayed
					"
                >
                    <img src="/Planet1.webp" alt="" className="h-full w-full" />
                </ParallaxLayer>
                <div className="max-w-2xl text-center relative z-10">
                    <h1 className="text-5xl md:text-6xl font-outfit font-semibold text-primary mb-6">
                        Thank you!
                    </h1>
                    <p className="text-lg md:text-xl text-primary mb-8">
                        Your application has been submitted successfully. We're excited to see you
                        at Hack the Skies!
                    </p>
                    <a
                        href="/"
                        className="
							inline-block
							rounded-full
							bg-button
							px-8 py-3
							font-outfit
							text-lg text-white
							shadow-[0_0_20px_rgba(130,104,180,0.45)]
							transition-all duration-150
							hover:bg-[#8268B4]
							hover:scale-105
						"
                    >
                        Return to Home
                    </a>
                </div>
            </section>
        );
    }

    return (
        <section className="relative min-h-screen bg-[#141123] px-6 py-12">
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

            <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
                <div className="flex-1">
                    {currentSection === 1 && (
                        <Section1
                            data={data}
                            updateData={updateData}
                            errors={errors}
                        />
                    )}
                    {currentSection === 2 && (
                        <Section2
                            data={data}
                            updateData={updateData}
                            errors={errors}
                        />
                    )}
                    {currentSection === 3 && (
                        <Section3
                            data={data}
                            updateData={updateData}
                            errors={errors}
                        />
                    )}
                    {currentSection === 4 && (
                        <Section4
                            data={data}
                            updateData={updateData}
                            errors={errors}
                        />
                    )}
                    {currentSection === 5 && (
                        <Section5
                            data={data}
                            updateData={updateData}
                            errors={errors}
                            wordCount={wordCount}
                        />
                    )}
                    {currentSection === 6 && (
                        <Section6
                            data={data}
                            updateData={updateData}
                            errors={errors}
                            onEditSection={handleEditSection}
                        />
                    )}

                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-between">
                        {currentSection > 1 && (
                            <button
                                onClick={handleBack}
                                className="
									rounded-full
									bg-button
									px-6 py-2
									font-outfit
									text-base text-white
									shadow-[0_0_20px_rgba(130,104,180,0.45)]
									transition-all duration-150
									hover:bg-[#8268B4]
									hover:scale-105
                                    cursor-pointer
								"
                            >
                                Back
                            </button>
                        )}

                        {currentSection < 6 ? (
                            <button
                                onClick={handleContinue}
                                className="
									rounded-full
									bg-button
									px-6 py-2
									font-outfit
									text-base text-white
									shadow-[0_0_20px_rgba(130,104,180,0.45)]
									transition-all duration-150
									hover:bg-[#8268B4]
									hover:scale-105
                                    cursor-pointer
									ml-auto
								"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="
									rounded-full
									bg-button
									px-6 py-2
									font-outfit
									text-base text-white
									shadow-[0_0_20px_rgba(130,104,180,0.45)]
									transition-all duration-150
									hover:bg-[#8268B4]
									hover:scale-105
									ml-auto
                                    cursor-pointer
								"
                            >
                                Submit Application
                            </button>
                        )}
                    </div>

                    {saveStatus && (
                        <div className="mt-4 text-center text-primary font-outfit text-sm">
                            {saveStatus === "saving" ? "Saving..." : "Saved"}
                        </div>
                    )}
                </div>

                <div className="hidden lg:flex flex-col items-center w-32">
                    <RocketProgressIndicator progress={getProgress()} />
                </div>
            </div>
        </section>
    );
}

function RocketProgressIndicator({ progress }: { progress: number }) {
    const rocketPosition = (progress / 100) * 400;

    return (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="text-primary font-outfit text-sm mb-4">Progress</div>
            <div className="relative w-16 h-[500px]">
                <div className="absolute inset-0 border-2 border-primary rounded-lg opacity-50" />
                <div
                    className="absolute top-0 left-0 right-0 bg-star rounded-lg transition-all duration-500"
                    style={{ height: `${progress * 5}px` }}
                />
                <div
                    className="absolute left-1/2 -translate-x-1/2 transition-all duration-500"
                    style={{ top: `${rocketPosition}px` }}
                >
                    <img
                        src="/rocket.png"
                        alt="Progress rocket"
                        width={60}
                        height={60}
                        className="drop-shadow-lg"
                    />
                </div>
            </div>
        </div>
    );
}

function Section1({
    data,
    updateData,
    errors,
}: {
    data: ApplicationData;
    updateData: (updates: Partial<ApplicationData>) => void;
    errors: Record<string, string>;
}) {
    const section1 = data.section1;

    const handleDietaryChange = (option: string) => {
        let newDietary = [...section1.dietaryRestrictions];
        if (option === "None") {
            newDietary = ["None"];
        } else if (newDietary.includes("None")) {
            newDietary = newDietary.filter((d) => d !== "None");
        }

        if (newDietary.includes(option)) {
            newDietary = newDietary.filter((d) => d !== option);
        } else {
            newDietary.push(option);
        }

        updateData({
            section1: { ...section1, dietaryRestrictions: newDietary },
        });
    };

    const handleAccessibilityChange = (option: string) => {
        let newAccess = [...section1.accessibilityAccommodations];
        if (option === "None") {
            newAccess = ["None"];
        } else if (newAccess.includes("None")) {
            newAccess = newAccess.filter((a) => a !== "None");
        }

        if (newAccess.includes(option)) {
            newAccess = newAccess.filter((a) => a !== option);
        } else {
            newAccess.push(option);
        }

        updateData({
            section1: { ...section1, accessibilityAccommodations: newAccess },
        });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                Personal Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
                <FormInput
                    label="First name"
                    value={section1.firstName}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, firstName: e.target.value },
                        })
                    }
                    error={errors.firstName}
                    required
                />
                <FormInput
                    label="Last name"
                    value={section1.lastName}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, lastName: e.target.value },
                        })
                    }
                    error={errors.lastName}
                    required
                />
            </div>

            <FormInput
                label="Preferred name"
                value={section1.preferredName}
                onChange={(e) =>
                    updateData({
                        section1: { ...section1, preferredName: e.target.value },
                    })
                }
                helperText="What should we call you? Leave blank if the same as your first name."
            />

            <div className="grid md:grid-cols-2 gap-6">
                <FormInput
                    label="Email"
                    type="email"
                    value={section1.email}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, email: e.target.value },
                        })
                    }
                    error={errors.email}
                    required
                />
                <FormInput
                    label="Phone number"
                    type="tel"
                    value={section1.phoneNumber}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, phoneNumber: e.target.value },
                        })
                    }
                    error={errors.phoneNumber}
                    required
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <FormInput
                    label="Date of birth"
                    type="date"
                    value={section1.dateOfBirth}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, dateOfBirth: e.target.value },
                        })
                    }
                    error={errors.dateOfBirth}
                    required
                />
                <FormSelect
                    label="T-shirt size"
                    value={section1.tShirtSize}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, tShirtSize: e.target.value },
                        })
                    }
                    options={["", "XS", "S", "M", "L", "XL", "2XL"]}
                    error={errors.tShirtSize}
                    required
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <FormInput
                    label="City"
                    value={section1.city}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, city: e.target.value },
                        })
                    }
                    error={errors.city}
                    required
                />
                <FormSelect
                    label="Province"
                    value={section1.province}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, province: e.target.value },
                        })
                    }
                    options={["", ...CANADIAN_PROVINCES]}
                    error={errors.province}
                    required
                />
            </div>

            <div>
                <label className="block text-primary font-outfit text-base mb-3">
                    Dietary restrictions <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                    {[
                        "None",
                        "Vegetarian",
                        "Vegan",
                        "Halal",
                        "Kosher",
                        "Gluten-free",
                        "Nut allergy",
                        "Other",
                    ].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={section1.dietaryRestrictions.includes(option)}
                                onChange={() => handleDietaryChange(option)}
                                className="w-4 h-4 cursor-pointer accent-primary"
                            />
                            <span className="text-primary font-outfit">{option}</span>
                        </label>
                    ))}
                </div>
                {section1.dietaryRestrictions.includes("Other") && (
                    <FormInput
                        label="Please specify"
                        value={section1.dietaryOther}
                        onChange={(e) =>
                            updateData({
                                section1: { ...section1, dietaryOther: e.target.value },
                            })
                        }
                        error={errors.dietaryOther}
                        className="mt-3"
                    />
                )}
                {errors.dietaryRestrictions && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.dietaryRestrictions}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-primary font-outfit text-base mb-3">
                    Accessibility accommodations{" "}
                    <span className="text-red-400">*</span>
                </label>
                <p className="text-primary font-outfit text-sm mb-3">
                    Let us know how we can make Hack the Skies more accessible and
                    comfortable for you.
                </p>
                <div className="space-y-2">
                    {[
                        "None",
                        "Mobility accommodation",
                        "Visual accommodation",
                        "Hearing accommodation",
                        "Quiet / low-stimulation space",
                        "Other",
                    ].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={section1.accessibilityAccommodations.includes(
                                    option
                                )}
                                onChange={() => handleAccessibilityChange(option)}
                                className="w-4 h-4 cursor-pointer accent-primary"
                            />
                            <span className="text-primary font-outfit">{option}</span>
                        </label>
                    ))}
                </div>
                {section1.accessibilityAccommodations.includes("Other") && (
                    <textarea
                        value={section1.accessibilityOther}
                        onChange={(e) =>
                            updateData({
                                section1: { ...section1, accessibilityOther: e.target.value },
                            })
                        }
                        placeholder="Please describe any accommodations you may need."
                        className="
							w-full
							mt-3
							p-3
							border border-primary
							rounded-lg
							bg-button
							text-primary
							font-outfit
							placeholder:text-primary/60
							focus:outline-none
							focus:ring-2
							focus:ring-primary
						"
                        rows={4}
                    />
                )}
                {errors.accessibilityAccommodations && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.accessibilityAccommodations}
                    </p>
                )}
                {errors.accessibilityOther && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.accessibilityOther}
                    </p>
                )}
            </div>
        </div>
    );
}

function Section2({
    data,
    updateData,
    errors,
}: {
    data: ApplicationData;
    updateData: (updates: Partial<ApplicationData>) => void;
    errors: Record<string, string>;
}) {
    const section2 = data.section2;
    const currentYear = new Date().getFullYear();
    const graduationYears = Array.from({ length: 8 }, (_, i) => currentYear + i);

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                School Information
            </h2>

            <FormInput
                label="School name"
                value={section2.schoolName}
                onChange={(e) =>
                    updateData({
                        section2: { ...section2, schoolName: e.target.value },
                    })
                }
                error={errors.schoolName}
                required
            />

            <div className="grid md:grid-cols-2 gap-6">
                <FormSelect
                    label="Current grade"
                    value={section2.grade}
                    onChange={(e) =>
                        updateData({
                            section2: { ...section2, grade: e.target.value },
                        })
                    }
                    options={["", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]}
                    error={errors.grade}
                    required
                />
                <FormSelect
                    label="Expected graduation year"
                    value={section2.graduationYear}
                    onChange={(e) =>
                        updateData({
                            section2: { ...section2, graduationYear: e.target.value },
                        })
                    }
                    options={["", ...graduationYears.map(String)]}
                    error={errors.graduationYear}
                    required
                />
            </div>

            <FormInput
                label="School city"
                value={section2.schoolCity}
                onChange={(e) =>
                    updateData({
                        section2: { ...section2, schoolCity: e.target.value },
                    })
                }
                error={errors.schoolCity}
                required
            />

            <div>
                <label className="block text-primary font-outfit text-base mb-3">
                    Are you currently enrolled in high school?{" "}
                    <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                    {["Yes", "No"].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="enrolledInHighSchool"
                                value={option}
                                checked={section2.enrolledInHighSchool === option}
                                onChange={(e) =>
                                    updateData({
                                        section2: { ...section2, enrolledInHighSchool: e.target.value },
                                    })
                                }
                                className="w-4 h-4 cursor-pointer accent-primary"
                            />
                            <span className="text-primary font-outfit">{option}</span>
                        </label>
                    ))}
                </div>
                {section2.enrolledInHighSchool === "No" && (
                    <div className="mt-4 p-4 bg-red-900/30 border border-red-400 rounded-lg">
                        <p className="text-red-300 font-outfit">
                            Hack the Skies is currently only open to students enrolled in high
                            school. Thank you for your interest!
                        </p>
                    </div>
                )}
                {errors.enrolledInHighSchool && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.enrolledInHighSchool}
                    </p>
                )}
            </div>
        </div>
    );
}

function Section3({
    data,
    updateData,
    errors,
}: {
    data: ApplicationData;
    updateData: (updates: Partial<ApplicationData>) => void;
    errors: Record<string, string>;
}) {
    const section3 = data.section3;

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                Parent / Guardian Information
            </h2>

            <FormInput
                label="Parent / guardian name"
                value={section3.parentName}
                onChange={(e) =>
                    updateData({
                        section3: { ...section3, parentName: e.target.value },
                    })
                }
                error={errors.parentName}
                required
            />

            <div className="grid md:grid-cols-2 gap-6">
                <FormInput
                    label="Parent / guardian email"
                    type="email"
                    value={section3.parentEmail}
                    onChange={(e) =>
                        updateData({
                            section3: { ...section3, parentEmail: e.target.value },
                        })
                    }
                    error={errors.parentEmail}
                    required
                />
                <FormInput
                    label="Parent / guardian phone number"
                    type="tel"
                    value={section3.parentPhone}
                    onChange={(e) =>
                        updateData({
                            section3: { ...section3, parentPhone: e.target.value },
                        })
                    }
                    error={errors.parentPhone}
                    required
                />
            </div>

            <FormInput
                label="Emergency contact name"
                value={section3.emergencyContactName}
                onChange={(e) =>
                    updateData({
                        section3: { ...section3, emergencyContactName: e.target.value },
                    })
                }
                error={errors.emergencyContactName}
                required
            />

            <FormInput
                label="Emergency contact phone number"
                type="tel"
                value={section3.emergencyContactPhone}
                onChange={(e) =>
                    updateData({
                        section3: { ...section3, emergencyContactPhone: e.target.value },
                    })
                }
                error={errors.emergencyContactPhone}
                required
            />

            <div>
                <FormSelect
                    label="Relationship to participant"
                    value={section3.emergencyContactRelationship}
                    onChange={(e) =>
                        updateData({
                            section3: { ...section3, emergencyContactRelationship: e.target.value },
                        })
                    }
                    options={["", "Parent", "Guardian", "Sibling", "Relative", "Family friend", "Other"]}
                    error={errors.emergencyContactRelationship}
                    required
                />
                {section3.emergencyContactRelationship === "Other" && (
                    <FormInput
                        label="Please specify"
                        value={section3.emergencyContactRelationshipOther}
                        onChange={(e) =>
                            updateData({
                                section3: { ...section3, emergencyContactRelationshipOther: e.target.value },
                            })
                        }
                        error={errors.emergencyContactRelationshipOther}
                        className="mt-3"
                    />
                )}
            </div>
        </div>
    );
}

function Section4({
    data,
    updateData,
    errors,
}: {
    data: ApplicationData;
    updateData: (updates: Partial<ApplicationData>) => void;
    errors: Record<string, string>;
}) {
    const section4 = data.section4;

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                Hackathon Information
            </h2>

            <div>
                <label className="block text-primary font-outfit text-base mb-3">
                    How many hackathons have you attended before?{" "}
                    <span className="text-red-400">*</span>
                </label>
                <select
                    value={section4.hackathonExperience}
                    onChange={(e) =>
                        updateData({
                            section4: { ...section4, hackathonExperience: e.target.value },
                        })
                    }
                    className="
						w-full
						p-3
						border border-primary
						rounded-lg
						bg-button
						text-primary
						font-outfit
						focus:outline-none
						focus:ring-2
						focus:ring-primary
						cursor-pointer
					"
                >
                    <option value="">Select an option</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                    <option value="unsure">I'm not sure</option>
                </select>
                {errors.hackathonExperience && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.hackathonExperience}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-primary font-outfit text-base mb-3">
                    How did you hear about Hack the Skies?{" "}
                    <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                    {[
                        "School",
                        "Friend",
                        "Social media",
                        "Hackathon community",
                        "Teacher",
                        "Club / organization",
                        "Search engine",
                        "Other",
                    ].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="heardAboutHTS"
                                value={option}
                                checked={section4.heardAboutHTS === option}
                                onChange={(e) =>
                                    updateData({
                                        section4: { ...section4, heardAboutHTS: e.target.value },
                                    })
                                }
                                className="w-4 h-4 cursor-pointer accent-primary"
                            />
                            <span className="text-primary font-outfit">{option}</span>
                        </label>
                    ))}
                </div>
                {section4.heardAboutHTS === "Other" && (
                    <FormInput
                        label="Please specify"
                        value={section4.heardAboutHTSOther}
                        onChange={(e) =>
                            updateData({
                                section4: { ...section4, heardAboutHTSOther: e.target.value },
                            })
                        }
                        error={errors.heardAboutHTSOther}
                        className="mt-3"
                    />
                )}
                {errors.heardAboutHTS && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.heardAboutHTS}
                    </p>
                )}
            </div>
        </div>
    );
}

function Section5({
    data,
    updateData,
    errors,
    wordCount,
}: {
    data: ApplicationData;
    updateData: (updates: Partial<ApplicationData>) => void;
    errors: Record<string, string>;
    wordCount: number;
}) {
    const section5 = data.section5;

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                Application Question
            </h2>

            <div>
                <label className="block text-primary font-outfit text-base mb-3">
                    Question: What is your interest in attending Hack the Skies?{" "}
                    <span className="text-red-400">*</span>
                </label>
                <textarea
                    value={section5.applicationQuestion}
                    onChange={(e) => {
                        const text = e.target.value;
                        const words = text.trim().split(/\s+/).filter((w) => w.length > 0)
                            .length;
                        if (words <= 300) {
                            updateData({
                                section5: { ...section5, applicationQuestion: text },
                            });
                        }
                    }}
                    placeholder="Type your answer here"
                    className="
						w-full
						p-4
						border border-primary
						rounded-lg
						bg-button
						text-primary
						font-outfit
						placeholder:text-primary/60
						focus:outline-none
						focus:ring-2
						focus:ring-primary
						min-h-[200px]
						resize-none
					"
                />
                <div className="flex justify-between items-center mt-2">
                    <p
                        className={`font-outfit text-sm ${wordCount > 300 ? "text-red-400" : "text-primary"
                            }`}
                    >
                        {wordCount} / 300 words
                    </p>
                    {errors.applicationQuestion && (
                        <p className="text-red-400 font-outfit text-sm">
                            {errors.applicationQuestion}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function Section6({
    data,
    updateData,
    errors,
    onEditSection,
}: {
    data: ApplicationData;
    updateData: (updates: Partial<ApplicationData>) => void;
    errors: Record<string, string>;
    onEditSection: (section: number) => void;
}) {
    const section6 = data.section6;

    return (
        <div className="space-y-8">
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                Review & Submit
            </h2>

            <ReviewSection
                title="Personal Information"
                onEdit={() => onEditSection(1)}
                content={[
                    { label: "First name", value: data.section1.firstName },
                    { label: "Last name", value: data.section1.lastName },
                    {
                        label: "Preferred name",
                        value: data.section1.preferredName || "(not provided)",
                    },
                    { label: "Email", value: data.section1.email },
                    { label: "Phone number", value: data.section1.phoneNumber },
                    { label: "Date of birth", value: data.section1.dateOfBirth },
                    { label: "T-shirt size", value: data.section1.tShirtSize },
                    { label: "City", value: data.section1.city },
                    { label: "Province", value: data.section1.province },
                    {
                        label: "Dietary restrictions",
                        value: data.section1.dietaryRestrictions.join(", "),
                    },
                    ...(data.section1.dietaryRestrictions.includes("Other")
                        ? [{ label: "Dietary specifications", value: data.section1.dietaryOther }]
                        : []),
                    {
                        label: "Accessibility accommodations",
                        value: data.section1.accessibilityAccommodations.join(", "),
                    },
                    ...(data.section1.accessibilityAccommodations.includes("Other")
                        ? [
                            {
                                label: "Accessibility specifications",
                                value: data.section1.accessibilityOther,
                            },
                        ]
                        : []),
                ]}
            />

            <ReviewSection
                title="School Information"
                onEdit={() => onEditSection(2)}
                content={[
                    { label: "School name", value: data.section2.schoolName },
                    { label: "Current grade", value: data.section2.grade },
                    { label: "Expected graduation year", value: data.section2.graduationYear },
                    { label: "School city", value: data.section2.schoolCity },
                    {
                        label: "Enrolled in high school",
                        value: data.section2.enrolledInHighSchool,
                    },
                ]}
            />

            <ReviewSection
                title="Parent / Guardian Information"
                onEdit={() => onEditSection(3)}
                content={[
                    { label: "Parent / guardian name", value: data.section3.parentName },
                    { label: "Parent / guardian email", value: data.section3.parentEmail },
                    { label: "Parent / guardian phone", value: data.section3.parentPhone },
                    {
                        label: "Emergency contact name",
                        value: data.section3.emergencyContactName,
                    },
                    {
                        label: "Emergency contact phone",
                        value: data.section3.emergencyContactPhone,
                    },
                    {
                        label: "Emergency contact relationship",
                        value:
                            data.section3.emergencyContactRelationship ===
                                "Other"
                                ? data.section3.emergencyContactRelationshipOther
                                : data.section3.emergencyContactRelationship,
                    },
                ]}
            />

            <ReviewSection
                title="Hackathon Information"
                onEdit={() => onEditSection(4)}
                content={[
                    {
                        label: "Hackathons attended",
                        value: data.section4.hackathonExperience,
                    },
                    {
                        label: "How you heard about us",
                        value:
                            data.section4.heardAboutHTS === "Other"
                                ? data.section4.heardAboutHTSOther
                                : data.section4.heardAboutHTS,
                    },
                ]}
            />

            <ReviewSection
                title="Application Question"
                onEdit={() => onEditSection(5)}
                content={[
                    {
                        label: "Your answer",
                        value: data.section5.applicationQuestion,
                    },
                ]}
            />

            <div className="space-y-3 bg-white/5 border border-primary/30 rounded-lg p-6">
                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={section6.termsAgreed}
                        onChange={(e) =>
                            updateData({
                                section6: {
                                    ...section6,
                                    termsAgreed: e.target.checked,
                                },
                            })
                        }
                        className="w-5 h-5 mt-1 cursor-pointer accent-primary flex-shrink-0"
                    />
                    <span className="text-primary font-outfit text-base">
                        I agree to the{" "}
                        <a
                            href="/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-primary/80 transition-colors"
                        >
                            Terms of Service
                        </a>
                        {" "}and acknowledge the{" "}
                        <a
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-primary/80 transition-colors"
                        >
                            Privacy Policy
                        </a>
                        .
                    </span>
                </label>
                {errors.termsAgreed && (
                    <p className="text-red-400 font-outfit text-sm">
                        {errors.termsAgreed}
                    </p>
                )}

                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={section6.eligibilityConfirm}
                        onChange={(e) =>
                            updateData({
                                section6: {
                                    ...section6,
                                    eligibilityConfirm: e.target.checked,
                                },
                            })
                        }
                        className="w-5 h-5 mt-1 cursor-pointer accent-primary flex-shrink-0"
                    />
                    <span className="text-primary font-outfit text-base">
                        I confirm that I am currently enrolled in high school and meet the
                        eligibility requirements for Hack the Skies.
                    </span>
                </label>
                {errors.eligibilityConfirm && (
                    <p className="text-red-400 font-outfit text-sm">
                        {errors.eligibilityConfirm}
                    </p>
                )}

                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={section6.informationConfirm}
                        onChange={(e) =>
                            updateData({
                                section6: {
                                    ...section6,
                                    informationConfirm: e.target.checked,
                                },
                            })
                        }
                        className="w-5 h-5 mt-1 cursor-pointer accent-primary flex-shrink-0"
                    />
                    <span className="text-primary font-outfit text-base">
                        I confirm that the information provided in this application is accurate.
                    </span>
                </label>
                {errors.informationConfirm && (
                    <p className="text-red-400 font-outfit text-sm">
                        {errors.informationConfirm}
                    </p>
                )}

                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={section6.parentalConfirm}
                        onChange={(e) =>
                            updateData({
                                section6: {
                                    ...section6,
                                    parentalConfirm: e.target.checked,
                                },
                            })
                        }
                        className="w-5 h-5 mt-1 cursor-pointer accent-primary flex-shrink-0"
                    />
                    <span className="text-primary font-outfit text-base">
                        I understand that parent/guardian consent may be required for
                        participation.
                    </span>
                </label>
                {errors.parentalConfirm && (
                    <p className="text-red-400 font-outfit text-sm">
                        {errors.parentalConfirm}
                    </p>
                )}
            </div>
        </div>
    );
}

function ReviewSection({
    title,
    onEdit,
    content,
}: {
    title: string;
    onEdit: () => void;
    content: Array<{ label: string; value: string }>;
}) {
    return (
        <div className="border border-primary/30 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-outfit font-semibold text-primary">
                    {title}
                </h3>
                <button
                    onClick={onEdit}
                    className="
						text-primary
						font-outfit
						text-sm
						border border-primary
						px-4 py-2
						rounded-lg
						hover:bg-primary/10
						transition-colors
					"
                >
                    Edit
                </button>
            </div>
            <div className="space-y-3">
                {content.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="text-primary/70 font-outfit text-sm">
                            {item.label}
                        </span>
                        <span className="text-primary font-outfit font-medium">
                            {item.value || "(not provided)"}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FormInput({
    label,
    type = "text",
    value,
    onChange,
    error,
    helperText,
    required = false,
    className = "",
}: {
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    helperText?: string;
    required?: boolean;
    className?: string;
}) {
    return (
        <div className={className}>
            <label className="block text-primary font-outfit text-base mb-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            {helperText && (
                <p className="text-primary/60 font-outfit text-sm mb-2">
                    {helperText}
                </p>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                className={`
					w-full
					p-3
					border
					${error ? "border-red-400" : "border-primary"}
					rounded-lg
					bg-button
					text-primary
					font-outfit
					focus:outline-none
					focus:ring-2
					${error ? "focus:ring-red-400" : "focus:ring-primary"}
				`}
            />
            {error && (
                <p className="text-red-400 font-outfit text-sm mt-1">{error}</p>
            )}
        </div>
    );
}

function FormSelect({
    label,
    value,
    onChange,
    options,
    error,
    required = false,
}: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
    error?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-primary font-outfit text-base mb-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <select
                value={value}
                onChange={onChange}
                className={`
					w-full
					p-3
					border
					${error ? "border-red-400" : "border-primary"}
					rounded-lg
					bg-button
					text-primary
					font-outfit
					focus:outline-none
					focus:ring-2
					${error ? "focus:ring-red-400" : "focus:ring-primary"}
					cursor-pointer
				`}
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option || "Select an option"}
                    </option>
                ))}
            </select>
            {error && (
                <p className="text-red-400 font-outfit text-sm mt-1">{error}</p>
            )}
        </div>
    );
}
