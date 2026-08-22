"use client";

import Link from "next/link";
import ParallaxLayer from "@/components/ParallaxLayer";
import { useState } from "react";

export default function Questions() {
    const questions = [
    "Question 1",
    "Question 2",
    "Question 3",
    ];

    const maxWords = [300, 300, 300];

    const [count, setCount] = useState([0,0,0]);
    
    const [total, setTotal] = useState(0);

    const [answers, setAnswers] = useState<string[]>(
    questions.map(() => "")
    );

    const wordCount = (text: string) =>
    text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  return (
    <>
    {questions.map((question, index) => (
        <div key={index}>
            <h5 className="
            mt-12
            px-12
            font-outfit 
            text-xl 
            md:text-2xl l
            g:text-3xl
            font-normal 
            text-primary 
            select-none
            "
            >
             {index+1}. {question}
            </h5>
            <textarea
            value={answers[index]}
            onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[index] = e.target.value;
                setAnswers(newAnswers);
                const newCount = [...count];
                newCount[index] = (wordCount(e.target.value) !== 0) ? 1 : 0;
                setCount(newCount);
                setTotal(newCount.reduce((sum, c) => sum + c, 0));
                //console.log("index:", index, "value:", e.target.value, "newAnswers:", newAnswers);
            }}
            name="answer"
            placeholder="Type your answer here"
            className="
                mt-6
                border border-primary
                rounded-md
                p-2
                w-13/16
                h-100
                ml-12
                bg-button
                font-outfit
                text-xl
                text-primary
                placeholder:text-primary
            "
            />
            <p className={`
                ml-12
                mt-1
                text-sm
                ${wordCount(answers[index]) > maxWords[index] ? "text-red-500" : "text-primary"}
                font-outfit
            `}
            >
                {wordCount(answers[index])}
                {" / "}
                {maxWords[index]}
                {" "}
                {wordCount(answers[index]) === 1 ? "word" : "words"}
            </p>
        </div>
    ))}
    <div className="flex mt-12 px-12 pb-12">
            <button
                type="submit"
                className="
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
                "
            > Submit Now
            </button>
            <p className="fixed 
                top-48
                right-24    
                z-50 
                font-outfit 
                text-xl 
                text-primary">
                Progress
            </p>
            <div className="fixed
                top-60
                right-27.5
                z-50
                w-12
                h-150
                border
                border-primary
                rounded-md
                bg-button"
            />
            <div className="fixed
                top-60
                right-27.5
                z-50
                w-12
                border
                border-primary
                rounded-md
                bg-star"
                style = {{ height: `${(total) * 200}px` }}
            />
            <img
            src="/rocket.png"
            width={90}
            height={90}
            className="fixed 
            right-21  
            z-50"
            style={{ top: `${total * 200+235}px` }}
            />
    </div>
    </>
  );
}