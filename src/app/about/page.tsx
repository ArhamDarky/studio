import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import Link from 'next/link';
import { Wind, Info, Users, Linkedin, Briefcase, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About ChiCommute',
  description: 'Learn more about the ChiCommute application and the team behind it.',
};

const teamMembers = [
  {
    name: 'Alice Wonderland',
    role: 'Project Manager',
    major: 'Computer Science',
    linkedinUrl: 'https://www.linkedin.com/in/projectalice',
    avatarSeed: 'alice',
    avatarHint: 'woman professional',
  },
  {
    name: 'Bob The Developer',
    role: 'Lead Frontend Developer',
    major: 'Software Engineering',
    linkedinUrl: 'https://www.linkedin.com/in/devbob',
    avatarSeed: 'bob',
    avatarHint: 'man coding',
  },
  {
    name: 'Charlie Designer',
    role: 'UI/UX Designer',
    major: 'Interaction Design',
    linkedinUrl: 'https://www.linkedin.com/in/designcharlie',
    avatarSeed: 'charlie',
    avatarHint: 'person sketching',
  },
  {
    name: 'Diana QA',
    role: 'Backend & QA Engineer',
    major: 'Information Technology',
    linkedinUrl: 'https://www.linkedin.com/in/qadiana',
    avatarSeed: 'diana',
    avatarHint: 'woman tech',
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="flex items-center space-x-3">
        <Info className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-primary">About ChiCommute</h1>
      </div>
      
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-card-foreground/5 p-6">
          <div className="flex items-center space-x-3">
            <Wind className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl text-primary">Our Mission</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-lg text-foreground/90 leading-relaxed">
            ChiCommute is dedicated to providing Chicago residents and visitors with a seamless and efficient way to navigate the city's public transportation system. 
            We aim to deliver real-time bus and train information to make your commute stress-free and predictable.
          </p>
          <div className="rounded-lg overflow-hidden shadow-md">
            <Image
              src="https://picsum.photos/seed/chicago-transit/800/400"
              alt="Chicago Transit Scene"
              width={800}
              height={400}
              className="object-cover w-full h-auto"
              data-ai-hint="public transit"
            />
          </div>
          <CardDescription className="text-base text-muted-foreground italic">
            Our platform leverages cutting-edge technology to bring you live tracking, route information, and service alerts. Whether you're a daily commuter or an occasional rider, ChiCommute is your trusted partner for navigating Chicago.
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="bg-card-foreground/5 p-6">
          <div className="flex items-center space-x-3">
            <Users className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl text-primary">Meet the Team</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member) => (
            <Card key={member.name} className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="items-center text-center p-4">
                <Avatar className="w-24 h-24 mb-3 border-2 border-primary">
                  <AvatarImage src={`https://picsum.photos/seed/${member.avatarSeed}/150/150`} alt={member.name} data-ai-hint={member.avatarHint} />
                  <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{member.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2 px-4 pb-4">
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4 mr-2 text-primary/70" />
                  <span>{member.role}</span>
                </div>
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4 mr-2 text-primary/70" />
                  <span>{member.major}</span>
                </div>
                <Link href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                  <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-md">
          <CardHeader className="p-6">
            <CardTitle className="text-xl">Key Features</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <ul className="list-disc list-inside space-y-2 text-foreground/80">
              <li>Real-time bus tracking across all CTA routes.</li>
              <li>Live train tracking for all CTA 'L' lines.</li>
              <li>Metra commuter rail information (under development).</li>
              <li>User-friendly dashboard for an at-a-glance overview.</li>
              <li>Mobile-responsive design for on-the-go access.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="p-6">
            <CardTitle className="text-xl">Technology Stack</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <p className="text-foreground/80">
              This application is proudly built with modern web technologies including:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground">
                <li>Next.js (App Router)</li>
                <li>React & TypeScript</li>
                <li>Tailwind CSS</li>
                <li>ShadCN UI Components</li>
                <li>Genkit (for AI-powered features)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
