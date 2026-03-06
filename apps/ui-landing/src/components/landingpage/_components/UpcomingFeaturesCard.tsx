"use client";

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BellIcon, Check } from 'lucide-react'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useQueryState } from 'nuqs'
import { addToWaitlist, checkWaitlistStatus } from '@/lib/api/waitlistApi'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

/**
 * Maps feature titles to feature identifiers for the waitlist API.
 */
function getFeatureIdentifier(title: string): string {
    const mapping: Record<string, string> = {
        'Skill-Based Learning Tracks': 'skill-based-learning-tracks',
        'Mentor-Led Sessions': 'mentor-led-sessions',
        'National-Level Challenges': 'national-level-challenges',
        'Creator & Organizer Tools': 'creator-organizer-tools',
    };
    return mapping[title] || title.toLowerCase().replace(/\s+/g, '-');
}

export default function UpcomingFeaturesCard({
    title,
    description,
    image
}: {
    title: string;
    description: string;
    image: string;
}) {
    const { isSignedIn, getToken, isLoaded } = useAuth();
    const [authMode, setAuthMode] = useQueryState('auth');
    const [isLoading, setIsLoading] = useState(false);
    const [isOnWaitlist, setIsOnWaitlist] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);

    const featureId = getFeatureIdentifier(title);

    // Check waitlist status when component mounts and user is signed in
    useEffect(() => {
        const checkStatus = async () => {
            if (!isLoaded) return;

            if (!isSignedIn) {
                setIsCheckingStatus(false);
                return;
            }

            try {
                const token = await getToken();
                if (!token) {
                    setIsCheckingStatus(false);
                    return;
                }

                const status = await checkWaitlistStatus(token, featureId);
                setIsOnWaitlist(status.isOnWaitlist);
            } catch (error) {
                console.error('Error checking waitlist status:', error);
                // Don't show error toast for status check failures
            } finally {
                setIsCheckingStatus(false);
            }
        };

        checkStatus();
    }, [isSignedIn, isLoaded, getToken, featureId]);

    const handleNotifyClick = async () => {
        if (!isLoaded) return;

        // If not signed in, open auth modal
        if (!isSignedIn) {
            setAuthMode('login');
            return;
        }

        // If already on waitlist, show message
        if (isOnWaitlist) {
            toast.info('You are already on the waitlist for this feature!');
            return;
        }

        // Add to waitlist - this saves to our database
        setIsLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required. Please sign in.');
                setAuthMode('login');
                return;
            }

            // Save to our database via API
            await addToWaitlist(token, featureId);
            setIsOnWaitlist(true);
            toast.success('Successfully added to waitlist! We\'ll notify you when this feature launches.');
        } catch (error) {
            console.error('Error adding to waitlist:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to add to waitlist. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className='p-4 shadow-[0_2px_8px_2px_rgba(69,69,69,0.10)]'>
            <div className='flex w-full h-full'>
                <div className='flex flex-col gap-6 w-2/3'>
                    <h2 className='font-semibold text-2xl text-foreground'>{title}</h2>
                    <p className='text-neutral-600 flex-1'>{description}</p>
                    <div>
                        <Button
                            className='rounded-full text-neutral-100 font-medium text-xs'
                            onClick={handleNotifyClick}
                            disabled={isLoading || isCheckingStatus}
                        >
                            {isLoading || isCheckingStatus ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {isLoading ? 'Adding...' : 'Checking...'}
                                </>
                            ) : isOnWaitlist ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    On Waitlist
                                </>
                            ) : (
                                <>
                                    <BellIcon className="w-4 h-4 mr-2" />
                                    Be First to Try
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                <div className='w-1/3'>
                    <Image
                        src={`/illustrations/${image}`}
                        alt="Flow Card"
                        width={500}
                        height={500}
                    />
                </div>
            </div>
        </Card>
    )
}
