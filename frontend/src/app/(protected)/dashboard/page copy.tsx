'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Spotlight } from '@/components/ui/spotlight';
import { BorderBeam } from '@/components/ui/border-beam';
import { CardHoverEffect } from '@/components/ui/pulse-card';
import {
  LayoutDashboard,
  ClipboardList,
  HelpCircle,
  Megaphone,
  FileText,
  Bot,
  MessageSquare,
  Workflow,
  Rocket,
  Compass,
} from 'lucide-react';

interface AboutUsProps {
  title?: string;
  subtitle?: string;
  mission?: string;
  vision?: string;
  values?: Array<{
    title: string;
    description: string;
    icon: keyof typeof iconComponents;
  }>;
  className?: string;
}

const iconComponents = {
  LayoutDashboard: LayoutDashboard,
  ClipboardList: ClipboardList,
  HelpCircle: HelpCircle,
  Megaphone: Megaphone,
  FileText: FileText,
  Bot: Bot,
  MessageSquare: MessageSquare,
  Workflow: Workflow,
};

const defaultValues: AboutUsProps['values'] = [
  {
    title: 'Classroom Management',
    description:
      'Create and organize classrooms effortlessly. Manage students, announcements, assignments, quizzes, discussions, study materials, and classroom members from one centralized workspace.',
    icon: 'LayoutDashboard',
  },
  {
    title: 'AI Assignment Generator',
    description:
      'Create assignments in seconds using AI. Describe the topic, learning objective, grade level, or paste study content, and EduAI generates a complete assignment ready to review and publish.',
    icon: 'ClipboardList',
  },
  {
    title: 'AI Quiz Generator',
    description:
      'Generate quizzes automatically from a topic, chapter, notes, or uploaded learning material. EduAI creates well-structured questions while letting you review and edit before publishing.',
    icon: 'HelpCircle',
  },
  {
    title: 'AI Announcement Assistant',
    description:
      'Need to post an announcement? Give EduAI a short prompt or your rough ideas, and it will generate a clear, professional classroom announcement ready to publish.',
    icon: 'Megaphone',
  },
  {
    title: 'AI Study Material Assistant',
    description:
      'Upload notes, provide a topic, or describe what students need to learn. EduAI generates organized learning materials that teachers can edit before sharing with the class.',
    icon: 'FileText',
  },
  {
    title: 'AI Classroom Agent',
    description:
      'An intelligent assistant that understands your classroom context. Ask questions in natural language, request teaching materials, generate content, or get help managing activities.',
    icon: 'Bot',
  },
  {
    title: 'Discussions & Collaboration',
    description:
      'Encourage classroom interaction through discussion boards where teachers and students can ask questions, share ideas, and collaborate beyond regular lectures.',
    icon: 'MessageSquare',
  },
  {
    title: 'Smart Classroom Workflow',
    description:
      'Everything is connected. Create a classroom, invite students, publish announcements, upload materials, generate AI-powered assignments and quizzes, then manage discussions.',
    icon: 'Workflow',
  },
];

export default function AboutUs1() {
  const aboutData = {
    title: 'Welcome to EduAI',
    subtitle:
      'EduAI combines classroom management with AI assistance to help teachers create educational content faster while keeping everything organized in one place.',
    mission:
      'EduAI is an AI-powered classroom management platform built for teachers and students. It brings classrooms, assignments, quizzes, announcements, study materials, and discussions together in one workspace, with AI assistance built into every step so you can create educational content faster.',
    vision:
      'Create or join a classroom, then upload learning materials or create them manually. Use the AI Agent whenever you need help generating educational content, and always review AI-generated content before publishing. Publish assignments, quizzes, announcements, or study materials for students, and track everything from one dashboard.',
    values: defaultValues,
    className: 'relative overflow-hidden py-20',
  };

  const missionRef = useRef(null);
  const valuesRef = useRef(null);

  const missionInView = useInView(missionRef, { once: true, amount: 0.3 });
  const valuesInView = useInView(valuesRef, { once: true, amount: 0.3 });

  return (
    <section className="relative w-full overflow-hidden pt-20">
      <Spotlight
        gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(188, 49%, 43%, 0.12) 0, hsla(256, 86%, 68%, 0.08) 50%, hsla(188, 49%, 43%, 0) 80%)"

        gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(56, 84%, 61%, 0.10) 0, hsla(188, 49%, 43%, 0.06) 80%, transparent 100%)"

        gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(256, 86%, 68%, 0.08) 0, hsla(56, 84%, 61%, 0.06) 80%, transparent 100%)"
      />

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h1 className="from-foreground/80 via-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
            {aboutData.title}
          </h1>
          <p className="text-muted-foreground mt-6 text-xl">
            {aboutData.subtitle}
          </p>
        </motion.div>

        {/* What is EduAI & How to Use EduAI Section */}
        <div ref={missionRef} className="relative mx-auto mb-24 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={
              missionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }
            }
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="relative z-10 grid gap-12 md:grid-cols-2"
          >
            <motion.div
              whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              className="group border-border/40 relative block overflow-hidden rounded-2xl border bg-gradient-to-br p-10 backdrop-blur-3xl"
            >
              <BorderBeam
                duration={8}
                size={300}
                className="via-primary/40 from-transparent to-transparent"
              />

              <div className="from-primary/20 to-primary/5 mb-6 inline-flex aspect-square h-16 w-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-br backdrop-blur-sm">
                <Rocket className="text-primary h-8 w-8" />
              </div>

              <div className="space-y-4">
                <h2 className="from-primary/90 to-primary/70 mb-4 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
                  What is EduAI
                </h2>

                <p className="text-muted-foreground text-lg leading-relaxed">
                  {aboutData.mission}
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              className="group border-border/40 relative block overflow-hidden rounded-2xl border bg-gradient-to-br p-10 backdrop-blur-3xl"
            >
              <BorderBeam
                duration={8}
                size={300}
                className="from-transparent via-blue-500/40 to-transparent"
                reverse
              />
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 backdrop-blur-sm">
                <Compass className="h-8 w-8 text-blue-500" />
              </div>

              <h2 className="mb-4 bg-gradient-to-r from-blue-500/90 to-blue-500/70 bg-clip-text text-3xl font-bold text-transparent">
                How to Use EduAI
              </h2>

              <p className="text-muted-foreground text-lg leading-relaxed">
                {aboutData.vision}
              </p>
            </motion.div>
          </motion.div>
        </div>

        <div ref={valuesRef} className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              valuesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-12 text-center"
          >
            <h2 className="from-foreground/80 via-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
              Platform Features
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
              Everything you need to manage your classroom and create
              educational content with AI assistance.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {aboutData.values?.map((value, index) => {
              const IconComponent = iconComponents[value.icon];

              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={
                    valuesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                  }
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1 + 0.2,
                    ease: 'easeOut',
                  }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <CardHoverEffect
                    icon={<IconComponent className="h-6 w-6" />}
                    title={value.title}
                    description={value.description}
                    variant={
                      index % 4 === 0
                        ? 'purple'
                        : index % 4 === 1
                          ? 'primary'
                          : index % 4 === 2
                            ? 'secondary'
                            : 'accent'
                    }
                    glowEffect={true}
                    size="lg"
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}