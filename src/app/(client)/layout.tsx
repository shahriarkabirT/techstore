import Footer from '@/components/client/Footer';

import Navbar from '@/components/client/Navbar';
import CategoryBar from '@/components/client/CategoryBar';
import MobileBottomNavbar from '@/components/client/MobileBottomNavbar';
import FloatingCartButton from '@/components/client/FloatingCartButton';
import SpeedDial from '@/components/shared/SpeedDial';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { ComparisonProvider } from '@/context/ComparisonContext';
import { ReactNode } from 'react';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';
import ChildCategory from '@/models/ChildCategory';
import SubChildCategory from '@/models/SubChildCategory';

interface ClientLayoutProps {
    children: ReactNode;
}

export default async function ClientLayout({ children }: ClientLayoutProps) {
    let logoSettings = null;
    let featuredCategories: any[] = [];

    try {
        await dbConnect();

        const [settingsDoc, categories] = await Promise.all([
            Settings.findOne().lean() as any,
            Category.find({ isActive: true })
                .select('name slug order')
                .sort({ order: 1, name: 1 })
                .lean() as unknown as any[],
        ]);

        if (settingsDoc) {
            logoSettings = {
                logoUrl: settingsDoc.logoUrl || null,
                logoWidth: settingsDoc.logoWidth || 150,
                logoHeight: settingsDoc.logoHeight || 50,
                brandName: settingsDoc.brandName || null,
                contactPhone: settingsDoc.contactPhone || null,
                whatsapp: settingsDoc.whatsapp || null,
            };
        }

        if (categories.length > 0) {
            const categoryIds = categories.map((c: any) => c._id);
            const [subs, children, subChildren] = await Promise.all([
                SubCategory.find({
                    categoryId: { $in: categoryIds },
                    isActive: true,
                })
                    .select('name slug categoryId order')
                    .sort({ order: 1, name: 1 })
                    .lean() as unknown as any[],
                ChildCategory.find({
                    isActive: true,
                })
                    .select('name slug subCategoryId order')
                    .sort({ order: 1, name: 1 })
                    .lean() as unknown as any[],
                SubChildCategory.find({
                    isActive: true,
                })
                    .select('name slug childCategoryId order')
                    .sort({ order: 1, name: 1 })
                    .lean() as unknown as any[]
            ]);

            const subChildMap = new Map<string, any[]>();
            subChildren.forEach((sc: any) => {
                const pid = sc.childCategoryId?.toString();
                if (pid) {
                    if (!subChildMap.has(pid)) subChildMap.set(pid, []);
                    subChildMap.get(pid)!.push({ _id: sc._id.toString(), name: sc.name, slug: sc.slug });
                }
            });

            const childMap = new Map<string, any[]>();
            children.forEach((c: any) => {
                const pid = c.subCategoryId?.toString();
                if (pid) {
                    if (!childMap.has(pid)) childMap.set(pid, []);
                    childMap.get(pid)!.push({ 
                        _id: c._id.toString(), 
                        name: c.name, 
                        slug: c.slug,
                        subChildCategories: subChildMap.get(c._id.toString()) || []
                    });
                }
            });

            const subMap = new Map<string, any[]>();
            subs.forEach((s: any) => {
                const pid = s.categoryId.toString();
                if (!subMap.has(pid)) subMap.set(pid, []);
                subMap.get(pid)!.push({ 
                    _id: s._id.toString(), 
                    name: s.name, 
                    slug: s.slug,
                    childCategories: childMap.get(s._id.toString()) || []
                });
            });

            featuredCategories = categories.map((cat: any) => ({
                _id: cat._id.toString(),
                name: cat.name,
                slug: cat.slug,
                subCategories: subMap.get(cat._id.toString()) || [],
            }));
        }
    } catch (error) {
        console.error('Failed to fetch layout data:', error);
    }

    return (
        <CartProvider>
            <WishlistProvider>
                <ComparisonProvider>
                   <div className="min-h-screen flex flex-col pb-20 md:pb-0 overflow-x-clip w-full">
                        <Navbar initialSettings={logoSettings} />
                        <CategoryBar initialCategories={featuredCategories} />
                        <main className="flex-grow">{children}</main>

                        <Footer />
                        <MobileBottomNavbar />
                        <FloatingCartButton />
                        <SpeedDial initialSettings={logoSettings} />
                    </div>
                </ComparisonProvider>
            </WishlistProvider>
        </CartProvider>
    );
}
