import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/jwt';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET() {
    try {
        const userPayload = await getUserFromRequest();

        if (!userPayload) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const user = await User.findOne({ email: userPayload.email }).select('-password');

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            user,
        });

    } catch (error) {
        console.error('Profile Fetch Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const userPayload = await getUserFromRequest();

        if (!userPayload) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const data = await request.json();
        await dbConnect();

        // 1. Get current user to compare
        const currentUser = await User.findOne({ email: userPayload.email });
        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const updateData: any = {};

        // 2. Email Update Check
        if (data.email && data.email.toLowerCase() !== currentUser.email) {
            const emailLower = data.email.toLowerCase();
            const existingEmailUser = await User.findOne({ email: emailLower });

            if (existingEmailUser) {
                // If existing user is verified, block
                if (existingEmailUser.isEmailVerified) {
                    return NextResponse.json(
                        { success: false, message: 'Email is already in use by a verified account.' },
                        { status: 409 }
                    );
                }
                // If not verified, strict consistency might suggest blocking too, 
                // but if we follow signup logic, we might allow taking it or require them to sign up.
                // For profile update, let's block for now to be safe, unless user requests otherwise.
                return NextResponse.json(
                    { success: false, message: 'Email is already taken.' },
                    { status: 409 }
                );
            }
            updateData.email = emailLower;
            // If email changes, it should likely become unverified
            updateData.isEmailVerified = false;
        }

        // 3. Phone Update Check
        if (data.phone && data.phone !== currentUser.phone) {
            const existingPhoneUser = await User.findOne({ phone: data.phone });

            if (existingPhoneUser && existingPhoneUser._id.toString() !== currentUser._id.toString()) {
                if (existingPhoneUser.isPhoneVerified) {
                    return NextResponse.json(
                        { success: false, message: 'Phone number is already in use by a verified account.' },
                        { status: 409 }
                    );
                }

                // Steal logic for unverified phone
                existingPhoneUser.phone = undefined;
                await existingPhoneUser.save({ validateBeforeSave: false });
            }
            updateData.phone = data.phone;
            // If phone changes, it should become unverified
            updateData.isPhoneVerified = false;
        }

        if (data.name) updateData.name = data.name;
        // Phone handled above
        if (data.addressBook) updateData.addressBook = data.addressBook;
        if (data.image) updateData.image = data.image;
        if (data.bio !== undefined) updateData.bio = data.bio;
        if (data.gender) updateData.gender = data.gender;
        if (data.dateOfBirth) updateData.dateOfBirth = data.dateOfBirth;

        const user = await User.findByIdAndUpdate(
            currentUser._id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        return NextResponse.json({
            success: true,
            user,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Profile Update Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
