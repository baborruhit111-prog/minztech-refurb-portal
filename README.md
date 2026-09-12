# MiNZTECH Operations Portal (Microsoft Authorized Refurbisher)

Enterprise operations portal designed for **MiNZTECH**, high-volume Microsoft Authorized Laptop Refurbisher (10,000+ units/month) specializing in HP, Dell, and Lenovo Grade A+ business laptops.

## Brand Identity & Palette
- **Primary Neon Lime**: `#ccff33`
- **Secondary Olive Lime**: `#cee56c`
- **Surface & Dark Background**: `#1a1a1a` / `#121212`

## Key Capabilities
1. **Strict Anti-Autofill Login**:
   - Built to block aggressive browser password managers with decoy inputs and dynamic readonly protection.
   - **Default Owner / Super Admin**:
     - **Username**: `mt206.ruhit`
     - **Password**: `Ruhit@mt`
2. **Supabase Cloud Synchronization & Multi-Computer Authentication**:
   - All user credentials (Admins & Members) are stored and authenticated online via Supabase.
   - Team members anywhere in the world can log in from their own computers.
   - **Zero Data Loss Guarantee**: Local-first persistent storage (IndexedDB / localStorage) + offline queue that automatically synchronizes when connection is established.
   - Includes 1-click SQL schema generator ready to paste in Supabase SQL editor.
3. **Warm & Cold Customer Lists (CRM)**:
   - Separate segments for Warm Buyers and Cold Prospects.
   - 1-Click WhatsApp direct offer dispatcher with pre-formatted bilingual templates (English for USA, Spanish for Mexico).
   - 1-Click Email dispatcher with full laptop specifications and warranty.
   - CSV export & import.
4. **Dual-Market Social Media Content Calendar**:
   - Managing both **USA Account** (English, US B2B wholesale focus) and **LATAM / Mexico Account** (Spanish, Guadalajara warehouse focus).
   - Platforms: Facebook, Instagram, TikTok.
   - Post scheduling, caption copying, and publishing workflow.
5. **Google Drive-Connected Media Gallery**:
   - Direct preview of laptop images and unboxing / testing videos stored on Google Drive.
   - 1-Click direct download for members to post on social platforms.
6. **Member Daily Tasks**:
   - Daily checklist for team members tracking sales quotas, grading tasks, and warehouse intake.
7. **User Access Management**:
   - Admin panel to create Admin and Member accounts with instant Supabase cloud synchronization.

## Quick Start
Run the 1-click launcher:
```cmd
run-portal.bat
```
Or manually:
```cmd
npm run preview -- --port 5173 --host
```
Open in browser: `http://localhost:5173`
