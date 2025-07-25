// src/app/signup/page.jsx
"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { auth, db } from "@/lib/firebase";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

const END_POINT = "https://panacea-api-qq0r.onrender.com";

async function createUserOnServer({
  firstName,
  lastName,
  email,
  password,
  role,
  specialty,
  licenseNumber,
  address,
  licenseDoc,
  idDoc,
}) {
  const form = new FormData();
  form.append("first_name", firstName);
  form.append("last_name", lastName);
  form.append("email", email);
  form.append("password", password);
  form.append("role", role);
  // send empty string so fcm_token is never undefined
  form.append("fcm_token", "");

  if (role === "Expert") {
    form.append("expert_field", specialty);
    form.append("phone_number", licenseNumber);
    form.append("street_number", address);
    form.append("street_name", "");
    form.append("city", "");
    form.append("state", "");
    form.append("zip_code", "");
    form.append("country", "");
  }

  // only “documents” fields go to your server
  if (licenseDoc) form.append("documents", licenseDoc);
  if (idDoc) form.append("documents", idDoc);

  const res = await fetch(`${END_POINT}/sign_up/create_user`, {
    method: "POST",
    body: form,
  });

  if (res.status !== 201) {
    let err = {};
    try {
      err = await res.json();
    } catch {}
    throw new Error(
      `Server returned ${res.status}: ${err.message || JSON.stringify(err)}`
    );
  }
}

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // fields & errors
  const [role, setRole] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [address, setAddress] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [licenseDoc, setLicenseDoc] = useState(null);
  const [idDoc, setIdDoc] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [licenseNumberError, setLicenseNumberError] = useState("");
  const [specialtyError, setSpecialtyError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [licenseDocError, setLicenseDocError] = useState("");
  const [idDocError, setIdDocError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const fileInputPhoto = useRef();
  const fileInputLicense = useRef();
  const fileInputId = useRef();

  const flow = [
    {
      key: "choose",
      component: (
        <>
          <h2 className="text-xl font-bold mb-4">I am a …</h2>
          <div className="flex space-x-4">
            {["Member", "Expert"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setRole(t);
                  setSubmitError("");
                }}
                className={`flex-1 p-4 border rounded ${
                  role === t
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {submitError && <p className="text-red-600 mt-2">{submitError}</p>}
        </>
      ),
      validate: () => {
        if (!role) {
          setSubmitError("Please choose User or Expert");
          return false;
        }
        return true;
      },
    },
    {
      key: "personal",
      component: (
        <>
          <h2 className="text-xl font-bold mb-4">Your Information</h2>
          <div className="space-y-4">
            <label className="block">
              <span>First Name</span>
              <input
                className="w-full border p-2 rounded"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setFirstNameError("");
                }}
              />
              {firstNameError && (
                <p className="text-red-600 text-sm">{firstNameError}</p>
              )}
            </label>
            <label className="block">
              <span>Last Name</span>
              <input
                className="w-full border p-2 rounded"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setLastNameError("");
                }}
              />
              {lastNameError && (
                <p className="text-red-600 text-sm">{lastNameError}</p>
              )}
            </label>
            <label className="block">
              <span>Email</span>
              <input
                type="email"
                className="w-full border p-2 rounded"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
              />
              {emailError && (
                <p className="text-red-600 text-sm">{emailError}</p>
              )}
            </label>
          </div>
        </>
      ),
      validate: () => {
        let ok = true;
        if (!firstName.trim()) {
          setFirstNameError("Required");
          ok = false;
        }
        if (!lastName.trim()) {
          setLastNameError("Required");
          ok = false;
        }
        if (!email.trim()) {
          setEmailError("Required");
          ok = false;
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
          setEmailError("Invalid");
          ok = false;
        }
        return ok;
      },
    },
    ...(role === "Expert"
      ? [
          {
            key: "doctor",
            component: (
              <>
                <h2 className="text-xl font-bold mb-4">Doctor Details</h2>
                <label className="block mb-4">
                  <span>License Number</span>
                  <input
                    className="w-full border p-2 rounded"
                    value={licenseNumber}
                    onChange={(e) => {
                      setLicenseNumber(e.target.value);
                      setLicenseNumberError("");
                    }}
                  />
                  {licenseNumberError && (
                    <p className="text-red-600 text-sm">{licenseNumberError}</p>
                  )}
                </label>
                <label className="block">
                  <span>Specialty</span>
                  <input
                    className="w-full border p-2 rounded"
                    value={specialty}
                    onChange={(e) => {
                      setSpecialty(e.target.value);
                      setSpecialtyError("");
                    }}
                  />
                  {specialtyError && (
                    <p className="text-red-600 text-sm">{specialtyError}</p>
                  )}
                </label>
              </>
            ),
            validate: () => {
              let ok = true;
              if (!licenseNumber.trim()) {
                setLicenseNumberError("Required");
                ok = false;
              }
              if (!specialty.trim()) {
                setSpecialtyError("Required");
                ok = false;
              }
              return ok;
            },
          },
        ]
      : []),
    {
      key: "photo",
      component: (
        <>
          <h2 className="text-xl font-bold mb-4">Profile Photo</h2>
          <button
            onClick={() => fileInputPhoto.current.click()}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Upload Photo
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputPhoto}
            className="hidden"
            onChange={(e) => {
              setPhotoFile(e.target.files[0]);
              setPhotoError("");
            }}
          />
          {photoError && <p className="text-red-600">{photoError}</p>}
          {photoFile && (
            <img
              src={URL.createObjectURL(photoFile)}
              className="h-24 w-24 rounded-full mt-2"
            />
          )}
        </>
      ),
      validate: () => {
        if (!photoFile) {
          setPhotoError("Required");
          return false;
        }
        return true;
      },
    },
    ...(role === "Expert"
      ? [
          {
            key: "docs",
            component: (
              <>
                <h2 className="text-xl font-bold mb-4">Upload Documents</h2>
                <label>License Doc</label>
                <input
                  type="file"
                  ref={fileInputLicense}
                  onChange={(e) => {
                    setLicenseDoc(e.target.files[0]);
                    setLicenseDocError("");
                  }}
                />
                {licenseDocError && (
                  <p className="text-red-600">{licenseDocError}</p>
                )}
                <label className="mt-4">ID / Passport</label>
                <input
                  type="file"
                  ref={fileInputId}
                  onChange={(e) => {
                    setIdDoc(e.target.files[0]);
                    setIdDocError("");
                  }}
                />
                {idDocError && <p className="text-red-600">{idDocError}</p>}
              </>
            ),
            validate: () => {
              let ok = true;
              if (!licenseDoc) {
                setLicenseDocError("Required");
                ok = false;
              }
              if (!idDoc) {
                setIdDocError("Required");
                ok = false;
              }
              return ok;
            },
          },
        ]
      : []),
    {
      key: "password",
      component: (
        <>
          <h2 className="text-xl font-bold mb-4">Set Password</h2>
          <p className="text-gray-600 text-sm mb-2">
            Your password must be at least 8 characters long and include at
            least one letter and one special character (@, #, $, %, &, *, !).
          </p>
          <label className="block mb-4">
            <span>Password</span>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
            />
            {passwordError && <p className="text-red-600">{passwordError}</p>}
          </label>
          <label className="block">
            <span>Confirm Password</span>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmPasswordError("");
              }}
            />
            {confirmPasswordError && (
              <p className="text-red-600">{confirmPasswordError}</p>
            )}
          </label>
        </>
      ),
      validate: () => {
        let ok = true;
        if (!/^(?=.*[A-Za-z])(?=.*[@#$%&*!]).{8,}$/.test(password)) {
          setPasswordError("Must be ≥8 chars, include letter & special char");
          ok = false;
        }
        if (confirmPassword !== password) {
          setConfirmPasswordError("Does not match");
          ok = false;
        }
        return ok;
      },
    },
    {
      key: "confirm",
      component: (
        <>
          <h2 className="text-xl font-bold mb-4">Confirm & Create Account</h2>
          <ul className="list-disc list-inside text-gray-700 mb-4">
            <li>
              <strong>Role:</strong> {role}
            </li>
            <li>
              <strong>Name:</strong> {firstName} {lastName}
            </li>
            <li>
              <strong>Email:</strong> {email}
            </li>
            {role === "Expert" && (
              <li>
                <strong>License #:</strong> {licenseNumber}
              </li>
            )}
            {role === "Expert" && (
              <li>
                <strong>Field:</strong> {specialty}
              </li>
            )}
            <li>
              <strong>Photo:</strong> {photoFile?.name}
            </li>
          </ul>
          {photoFile && (
            <img
              src={URL.createObjectURL(photoFile)}
              className="h-32 w-32 rounded-full mb-4"
            />
          )}
        </>
      ),
      validate: () => true,
    },
  ];

  const onNext = async () => {
    if (await flow[step].validate())
      setStep((s) => Math.min(s + 1, flow.length - 1));
  };
  const onBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setSubmitError("");
    try {
      await createUserOnServer({
        firstName,
        lastName,
        email,
        password,
        role,
        specialty,
        licenseNumber,
        address,
        licenseDoc,
        idDoc,
      });

      // now sign in & upload profile pic
      await signInWithEmailAndPassword(auth, email, password);

      // 3) Persist basic info
      localStorage.setItem("firstName", firstName);
      localStorage.setItem("lastName", lastName);
      // your server is creating role "Doctor" or "User"
      // but in your client you use "doctor"/"user" or similar
      const storedRole = role === "Expert" ? "doctor" : "user";
      localStorage.setItem("role", storedRole);

      if (photoFile) {
        const storage = getStorage();
        const ref = storageRef(
          storage,
          `images/${auth.currentUser.uid}/profile.png`
        );
        await uploadBytes(ref, photoFile);
        const url = await getDownloadURL(ref);
        await updateProfile(auth.currentUser, { photoURL: url });
        await updateDoc(
          doc(
            db,
            role === "Expert" ? "doctors" : "users",
            auth.currentUser.uid
          ),
          {
            profile_picture: url,
          }
        );
      }

      router.push(role === "Expert" ? "/doctor" : "/user");
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  }, [
    firstName,
    lastName,
    email,
    password,
    role,
    specialty,
    licenseNumber,
    address,
    photoFile,
    licenseDoc,
    idDoc,
    router,
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
      <div className="w-full max-w-xl bg-white p-8 rounded-lg shadow space-y-6">
        {submitError && (
          <p className="text-red-600 text-center">{submitError}</p>
        )}

        {flow[step].component}

        <div className="flex justify-between items-center mt-6">
          {step > 0 ? (
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" /> Back
            </button>
          ) : (
            <div />
          )}
          {step < flow.length - 1 ? (
            <button
              onClick={onNext}
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Next <ArrowRightIcon className="h-5 w-5 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Creating…" : "Sign Up"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
