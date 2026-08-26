import BackNavigationReload from "@/components/BackNavigationReload";
import Contact from "@/components/Contact";
import Downloads from "@/components/Downloads";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import JoinUs from "@/components/JoinUs";
import Team from "@/components/Team";
import TopBar from "@/components/TopBar";

export default function Home() {
	return (
		<main className="flex flex-col min-h-screen">
			<div className="flex-1">
				<TopBar />
				<Hero />
				<JoinUs />
				<FAQ />
				<Team />
				<Contact />
				<Downloads />
			</div>
			<Footer />
		</main>
	);
}
