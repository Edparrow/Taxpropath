import type { Metadata } from "next";
import { PageBanner, Prose } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Taxpropath collects, uses, and discloses personal data when you use our service.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageBanner
        title="Privacy Policy"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/privacy-policy", label: "Privacy Policy" },
        ]}
      />

      <Prose>
        <p className="!text-[13.5px] !font-semibold uppercase tracking-wider !text-slate-500">
          Effective for all users of taxpropath.com
        </p>

        <p>
          Taxpropath (&ldquo;us&rdquo;, &ldquo;we&rdquo;, or &ldquo;our&rdquo;)
          operates the taxpropath.com website (the &ldquo;Service&rdquo;). This page
          informs you of our policies regarding the collection, use, and disclosure of
          personal data when you use our Service and the choices you have associated
          with that data.
        </p>
        <p>
          We use your data to provide and improve the Service. By using the Service,
          you agree to the collection and use of information in accordance with this
          policy. Unless otherwise defined in this Privacy Policy, terms used have the
          same meanings as in our Terms and Conditions, accessible from taxpropath.com
        </p>

        <h2>Information Collection And Use</h2>
        <p>
          We collect several different types of information for various purposes to
          provide and improve our Service to you.
        </p>

        <h3>Personal Data</h3>
        <p>
          While using our Service, we may ask you to provide us with certain personally
          identifiable information that can be used to contact or identify you
          (&ldquo;Personal Data&rdquo;). Personally identifiable information may
          include, but is not limited to:
        </p>
        <ul>
          <li>Email address</li>
          <li>First name and last name</li>
          <li>Phone number</li>
          <li>Address, State, Province, ZIP/Postal code, City</li>
          <li>Cookies and Usage Data</li>
        </ul>

        <h3>Usage Data</h3>
        <p>
          We may also collect information on how the Service is accessed and used
          (&ldquo;Usage Data&rdquo;). This Usage Data may include information such as
          your computer&rsquo;s Internet Protocol address (e.g. IP address), browser
          type, browser version, the pages of our Service that you visit, the time and
          date of your visit, the time spent on those pages, unique device identifiers
          and other diagnostic data.
        </p>

        <h3>Tracking &amp; Cookies Data</h3>
        <p>
          We use cookies and similar tracking technologies to track the activity on our
          Service and hold certain information.
        </p>
        <p>
          Cookies are files with a small amount of data which may include an anonymous
          unique identifier. Cookies are sent to your browser from a website and stored
          on your device. Tracking technologies also used are beacons, tags, and
          scripts to collect and track information and to improve and analyze our
          Service.
        </p>
        <p>
          You can instruct your browser to refuse all cookies or to indicate when a
          cookie is being sent. However, if you do not accept cookies, you may not be
          able to use some portions of our Service.
        </p>
        <p>Examples of Cookies we use:</p>
        <ul>
          <li>
            <strong>Session Cookies.</strong> We use Session Cookies to operate our
            Service.
          </li>
          <li>
            <strong>Preference Cookies.</strong> We use Preference Cookies to remember
            your preferences and various settings.
          </li>
          <li>
            <strong>Security Cookies.</strong> We use Security Cookies for security
            purposes.
          </li>
        </ul>

        <h2>Use of Data</h2>
        <p>Taxpropath uses the collected data for various purposes:</p>
        <ul>
          <li>To provide and maintain the Service</li>
          <li>To notify you about changes to our Service</li>
          <li>
            To allow you to participate in interactive features of our Service when you
            choose to do so
          </li>
          <li>To provide customer care and support</li>
          <li>
            To provide analysis or valuable information so that we can improve the
            Service
          </li>
          <li>To monitor the usage of the Service</li>
          <li>To detect, prevent and address technical issues</li>
        </ul>

        <h2>Transfer Of Data</h2>
        <p>
          Your information, including Personal Data, may be transferred to — and
          maintained on — computers located outside of your state, province, country or
          other governmental jurisdiction where the data protection laws may differ
          than those from your jurisdiction.
        </p>
        <p>
          Your consent to this Privacy Policy followed by your submission of such
          information represents your agreement to that transfer. Taxpropath will take
          all steps reasonably necessary to ensure that your data is treated securely
          and in accordance with this Privacy Policy.
        </p>

        <h2>Disclosure Of Data</h2>
        <h3>Legal Requirements</h3>
        <p>
          Taxpropath may disclose your Personal Data in the good faith belief that such
          action is necessary to:
        </p>
        <ul>
          <li>To comply with a legal obligation</li>
          <li>To protect and defend the rights or property of Taxpropath</li>
          <li>
            To prevent or investigate possible wrongdoing in connection with the Service
          </li>
          <li>To protect the personal safety of users of the Service or the public</li>
          <li>To protect against legal liability</li>
        </ul>

        <h2>Security Of Data</h2>
        <p>
          The security of your data is important to us, but remember that no method of
          transmission over the Internet, or method of electronic storage is 100%
          secure. While we strive to use commercially acceptable means to protect your
          Personal Data, we cannot guarantee its absolute security.
        </p>

        <h2>Service Providers</h2>
        <p>
          We may employ third party companies and individuals to facilitate our Service
          (&ldquo;Service Providers&rdquo;), to provide the Service on our behalf, to
          perform Service-related services or to assist us in analyzing how our Service
          is used.
        </p>
        <p>
          These third parties have access to your Personal Data only to perform these
          tasks on our behalf and are obligated not to disclose or use it for any other
          purpose.
        </p>

        <h3>Analytics</h3>
        <p>
          We may use third-party Service Providers to monitor and analyze the use of
          our Service, including Google Analytics — a web analytics service offered by
          Google that tracks and reports website traffic.
        </p>

        <h2>Links To Other Sites</h2>
        <p>
          Our Service may contain links to other sites that are not operated by us. If
          you click on a third party link, you will be directed to that third
          party&rsquo;s site. We strongly advise you to review the Privacy Policy of
          every site you visit.
        </p>
        <p>
          We have no control over and assume no responsibility for the content, privacy
          policies or practices of any third party sites or services.
        </p>

        <h2>Children&rsquo;s Privacy</h2>
        <p>
          Our Service does not address anyone under the age of 18
          (&ldquo;Children&rdquo;). We do not knowingly collect personally identifiable
          information from anyone under the age of 18. If you are a parent or guardian
          and you are aware that your child has provided us with Personal Data, please
          contact us.
        </p>

        <h2>Changes To This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any
          changes by posting the new Privacy Policy on this page. You are advised to
          review this Privacy Policy periodically for any changes.
        </p>
      </Prose>
    </>
  );
}
