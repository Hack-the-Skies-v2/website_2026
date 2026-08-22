import BackNavigationReload from "@/components/BackNavigationReload";
import Contact from "@/components/Contact";
import Downloads from "@/components/Downloads";
import FAQ from "@/components/FAQ";
import Hero from "@/components/Hero";
import JoinUs from "@/components/JoinUs";
import Team from "@/components/Team";
import TopBar from "@/components/TopBar";

export default function Home() {
	return (
		<main>
			<TopBar />
			<Hero />
			<JoinUs />
			<FAQ />
			<Team />
			<Contact />
			<Downloads />
		</main>
	);
}
