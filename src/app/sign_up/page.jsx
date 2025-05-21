// src/app/signup/page.jsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  setDoc
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { auth, db } from '@/lib/firebase';
import { ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function SignUpPage() {
  const router = useRouter();

  // Step index
  const [step, setStep] = useState(0);

  // Role & fields
  const [role, setRole] = useState(''); // '' until chosen
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [address, setAddress] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [licenseDoc, setLicenseDoc] = useState(null);
  const [idDoc, setIdDoc] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Errors
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [licenseNumberError, setLicenseNumberError] = useState('');
  const [specialtyError, setSpecialtyError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [licenseDocError, setLicenseDocError] = useState('');
  const [idDocError, setIdDocError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputPhoto = useRef();
  const fileInputLicense = useRef();
  const fileInputId = useRef();

  // Build dynamic flow
  const flow = [
    {
      key: 'choose',
      component: (
        <>
          <h2 className="text-xl font-bold mb-4">I am a …</h2>
          <div className="flex space-x-4">
            {['Member','Expert'].map(t => (
              <button
                key={t}
                onClick={() => setRole(t)}
                className={`flex-1 p-4 border rounded ${
                  role===t
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      ),
      validate: () => {
        if (!role) {
          setSubmitError('Please select Member or Expert.');
          return false;
        }
        setSubmitError('');
        return true;
      }
    },
    {
      key: 'personal',
      component: (
        <>
          <h2 className="text-xl font-bold mb-4">Personal Info</h2>
          <div className="space-y-4">
            <label className="block">
              <span>First Name</span>
              <input
                className="w-full border p-2 rounded"
                value={firstName}
                onChange={e => { setFirstName(e.target.value); setFirstNameError(''); }}
              />
              {firstNameError && <p className="text-red-600 text-sm">{firstNameError}</p>}
            </label>
            <label className="block">
              <span>Last Name</span>
              <input
                className="w-full border p-2 rounded"
                value={lastName}
                onChange={e => { setLastName(e.target.value); setLastNameError(''); }}
              />
              {lastNameError && <p className="text-red-600 text-sm">{lastNameError}</p>}
            </label>
            <label className="block">
              <span>Email</span>
              <input
                type="email"
                className="w-full border p-2 rounded"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(''); }}
              />
              {emailError && <p className="text-red-600 text-sm">{emailError}</p>}
            </label>
          </div>
        </>
      ),
      validate: () => {
        let ok = true;
        if (!firstName.trim()) {
          setFirstNameError('First name is required');
          ok = false;
        }
        if (!lastName.trim()) {
          setLastNameError('Last name is required');
          ok = false;
        }
        if (!email.trim()) {
          setEmailError('Email is required');
          ok = false;
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
          setEmailError('Invalid email');
          ok = false;
        }
        return ok;
      }
    },
    // expert details only
    ...(role==='Expert' ? [{
      key: 'expert',
      component: (
        <>
          <h2 className="text-xl font-bold mb-4">Expert Details</h2>
          <div className="space-y-4">
            <label className="block">
              <span>License Number</span>
              <input
                className="w-full border p-2 rounded"
                value={licenseNumber}
                onChange={e => { setLicenseNumber(e.target.value); setLicenseNumberError(''); }}
              />
              {licenseNumberError && <p className="text-red-600 text-sm">{licenseNumberError}</p>}
            </label>
            <label className="block">
              <span>Specialty</span>
              <input
                className="w-full border p-2 rounded"
                value={specialty}
                onChange={e => { setSpecialty(e.target.value); setSpecialtyError(''); }}
              />
              {specialtyError && <p className="text-red-600 text-sm">{specialtyError}</p>}
            </label>
          </div>
        </>
      ),
      validate: () => {
        let ok = true;
        if (!licenseNumber.trim()) {
          setLicenseNumberError('License # is required');
          ok = false;
        }
        if (!specialty.trim()) {
          setSpecialtyError('Specialty is required');
          ok = false;
        }
        return ok;
      }
    }] : []),
    // address
    {
      key: 'address',
      component: (
        <>
          <h2 className="text-xl font-bold mb-4">Address</h2>
          <label className="block">
            <span>Address</span>
            <input
              className="w-full border p-2 rounded"
              value={address}
              onChange={e => { setAddress(e.target.value); setAddressError(''); }}
              placeholder="Street, City, ZIP…"
            />
            {addressError && <p className="text-red-600 text-sm">{addressError}</p>}
          </label>
        </>
      ),
      validate: () => {
        if (!address.trim()) {
          setAddressError('Address is required');
          return false;
        }
        return true;
      }
    },
    // photo
    {
      key: 'photo',
      component: (
        <>
          <h2 className="text-xl font-bold mb-4">Profile Photo</h2>
          <input
            type="file"
            accept="image/*"
            ref={fileInputPhoto}
            onChange={e => {
              setPhotoFile(e.target.files[0]);
              setPhotoError('');
            }}
          />
          {photoError && <p className="text-red-600 text-sm">{photoError}</p>}
          {photoFile && <p className="mt-2 text-sm">Selected: {photoFile.name}</p>}
        </>
      ),
      validate: () => {
        if (!photoFile) {
          setPhotoError('Please upload a profile photo');
          return false;
        }
        return true;
      }
    },
    // docs for expert only
    ...(role==='Expert' ? [{
      key: 'docs',
      component: (
        <>
          <h2 className="text-xl font-bold mb-4">Upload Documents</h2>
          <p className="text-sm">License Document:</p>
          <input
            type="file"
            accept="application/pdf,image/*"
            ref={fileInputLicense}
            onChange={e => {
              setLicenseDoc(e.target.files[0]);
              setLicenseDocError('');
            }}
          />
          {licenseDocError && <p className="text-red-600 text-sm">{licenseDocError}</p>}
          <p className="text-sm mt-4">ID / Passport:</p>
          <input
            type="file"
            accept="application/pdf,image/*"
            ref={fileInputId}
            onChange={e => {
              setIdDoc(e.target.files[0]);
              setIdDocError('');
            }}
          />
          {idDocError && <p className="text-red-600 text-sm">{idDocError}</p>}
        </>
      ),
      validate: () => {
        let ok = true;
        if (!licenseDoc) {
          setLicenseDocError('Please upload license doc');
          ok = false;
        }
        if (!idDoc) {
          setIdDocError('Please upload ID/passport');
          ok = false;
        }
        return ok;
      }
    }] : []),
    // password
    {
      key: 'password',
      component: (
        <>
          <h2 className="text-xl font-bold mb-4">Set Password</h2>
          <label className="block mb-2">
            <span>Password</span>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={password}
              onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
            />
            {passwordError && <p className="text-red-600 text-sm">{passwordError}</p>}
          </label>
          <label className="block">
            <span>Confirm Password</span>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setConfirmPasswordError(''); }}
            />
            {confirmPasswordError && <p className="text-red-600 text-sm">{confirmPasswordError}</p>}
          </label>
        </>
      ),
      validate: () => {
        let ok = true;
        if (password.length < 6) {
          setPasswordError('At least 6 chars');
          ok = false;
        }
        if (confirmPassword !== password) {
          setConfirmPasswordError('Does not match');
          ok = false;
        }
        return ok;
      }
    },
    // confirmation
    {
      key: 'confirm',
      component: (
        <>
          <h2 className="text-xl font-bold mb-4">Confirm & Create Account</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Role:</strong> {role}</li>
            <li><strong>Name:</strong> {firstName} {lastName}</li>
            <li><strong>Email:</strong> {email}</li>
            <li><strong>Address:</strong> {address}</li>
            {role==='Expert' && (
              <>
                <li><strong>License #:</strong> {licenseNumber}</li>
                <li><strong>Field:</strong> {specialty}</li>
                <li><strong>Docs:</strong> {licenseDoc?.name}, {idDoc?.name}</li>
              </>
            )}
            <li><strong>Photo:</strong> {photoFile?.name}</li>
          </ul>
        </>
      ),
      validate: () => true
    }
  ];

  const onNext = () => {
    const { validate } = flow[step];
    if (!validate()) return;
    setStep(s => Math.min(s + 1, flow.length - 1));
  };
  
  const onBack = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setSubmitError('');
    try {
      // create auth
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const uid = user.uid;

      // upload photo
      let photoURL = '';
      if (photoFile) {
        const storage = getStorage();
        const pRef = storageRef(storage, `images/${uid}/profile.png`);
        await uploadBytes(pRef, photoFile);
        photoURL = await getDownloadURL(pRef);
        await updateProfile(user, { photoURL });
      }

      // upload docs if expert
      const docsURLs = {};
      if (role==='Expert') {
        const storage = getStorage();
        const lRef = storageRef(storage, `docs/${uid}/license`);
        await uploadBytes(lRef, licenseDoc);
        docsURLs.licenseURL = await getDownloadURL(lRef);

        const iRef = storageRef(storage, `docs/${uid}/id`);
        await uploadBytes(iRef, idDoc);
        docsURLs.idURL = await getDownloadURL(iRef);
      }

      // write firestore
      const base = {
        firstName, lastName, email,
        address, photoURL,
        ...docsURLs,
        role: role==='Expert' ? 'doctor' : 'patient'
      };
      if (role==='Expert') {
        await setDoc(doc(db, 'doctors', uid), {
          licenseNumber, specialty, ...base
        });
      } else {
        await setDoc(doc(db, 'patients', uid), base);
      }

      // done
      router.push(role==='Expert' ? '/expert' : '/member');
    } catch (e) {
      console.error(e);
      setSubmitError(e.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  }, [
    role, firstName, lastName, email, password, address,
    photoFile, licenseDoc, idDoc, licenseNumber, specialty
  ]);

  // render
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
      <div className="w-full max-w-xl bg-white p-8 rounded-lg shadow space-y-6">
        {/* any submit error */}
        {submitError && <p className="text-red-600 text-center">{submitError}</p>}

        {/* current step */}
        {flow[step].component}

        {/* nav */}
        <div className="flex justify-between items-center mt-6">
          {step>0
            ? <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1"/> Back
              </button>
            : <div/>
          }

          {step < flow.length - 1
            ? <button
                onClick={onNext}
                className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Next <ArrowRightIcon className="h-5 w-5 ml-1"/>
              </button>
            : <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating…' : 'Sign Up'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}