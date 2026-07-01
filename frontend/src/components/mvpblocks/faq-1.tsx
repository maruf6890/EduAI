'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { PlusIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from '@/components/ui/accordion';
import { s } from 'framer-motion/client';

const items = [
  {
    id: '1',
    title: 'How does the AI answer student questions?',
    content:
      'Students can ask questions about lessons, homework, or course materials. The AI-powered chatbot understands natural language queries, refers to the uploaded course content, and provides clear, context-aware explanations and answers directly within the learning interface.',
  },
  {
    id: '2',
    title: 'How do teachers manage course materials and assignments?',
    content:
      'Teachers can upload lecture notes, PDFs, syllabi, and other learning resources. The platform automatically organizes these materials, makes them searchable, and allows teachers to generate quizzes, create assignments, and share them with students in a single workspace.',
  },
  {
    id: '3',
    title: 'How does the AI help teachers in classroom management?',
    content:
      'Teachers can use the AI to auto-generate quizzes, publish announcements, summarize lessons, and monitor student progress. The platform provides insights into student engagement and identifies areas where learners may need additional support, helping teachers manage their classes more effectively.',
  },
  {
    id: '4',
    title: 'How does ClassMind help students study and revise?',
    content:
      'Students can access AI-generated summaries of lessons, take practice quizzes on specific topics, and receive personalized study plans. The AI adapts to each student learning pace, offering targeted support to help them master course content more effectively.',
  },
  {
    id: '5',
    title: 'Is ClassMind suitable for both offline and online learning environments?',
    content:
      'Yes, ClassMind works seamlessly in both offline and online settings. The platform automatically saves all data and progress locally, ensuring uninterrupted learning even without an internet connection. Once the connection is restored, all data syncs automatically.',
  },
  {
    id: '6',
    title: 'Can ClassMind be used for different subjects and grade levels?',
    content: 'Yes, ClassMind is designed to support various subjects and grade levels. Teachers can upload course materials for any subject, and the AI can generate relevant quizzes, summaries, and study aids tailored to the specific content and learning requirements.',
  },

];

const fadeInAnimationVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 * index,
      duration: 0.4,
    },
  }),
};

export default function Faq1() {
  return (
    <section className="py-12 md:py-16 bg-bg-main text-text-main transition-colors duration-300">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-10 text-center">
          <motion.h2
            className="mb-4 text-3xl font-extrabold tracking-tight md:text-4xl text-text-main"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
              Questions
            </span>
          </motion.h2>

          <motion.p
            className="mx-auto max-w-2xl text-sm text-text-main/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Everything you need to know about Arogya AI.
          </motion.p>
        </div>

        <motion.div
          className="relative mx-auto max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Decorative blur effects */}
          <div className="absolute -top-4 -left-4 -z-10 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl" />
          <div className="absolute -right-4 -bottom-4 -z-10 h-72 w-72 rounded-full bg-brand-secondary/10 blur-3xl" />

          <Accordion
            type="single"
            collapsible
            defaultValue="1"
            className="w-full rounded-2xl border border-surface-border bg-surface p-2 backdrop-blur-md shadow-soft"
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                custom={index}
                variants={fadeInAnimationVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={item.id}
                  className={cn(
                    'my-2 overflow-hidden rounded-xl bg-surface transition-all duration-300',
                    'hover:border-brand-primary/20',
                    'data-[state=open]:shadow-soft'
                  )}
                >
                  <AccordionPrimitive.Header className="flex">
                    <AccordionPrimitive.Trigger
                      className={cn(
                        'group flex flex-1 items-center justify-between gap-4 py-5 px-4',
                        'text-left text-base font-bold text-text-main',
                        'transition-colors duration-300',
                        'hover:text-brand-primary',
                        'focus-visible:ring-2 focus-visible:ring-brand-primary/30',
                        'data-[state=open]:text-brand-primary'
                      )}
                    >
                      {item.title}

                      <PlusIcon
                        size={18}
                        className={cn(
                          'shrink-0 text-brand-primary transition-transform duration-300',
                          'group-data-[state=open]:rotate-45'
                        )}
                      />
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>

                  <AccordionContent
                    className={cn(
                      'overflow-hidden px-4 pb-5 text-sm leading-relaxed text-text-main/70',
                      'data-[state=open]:animate-accordion-down',
                      'data-[state=closed]:animate-accordion-up'
                    )}
                  >
                    <div className="border-t border-surface-border pt-4">
                      {item.content}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}