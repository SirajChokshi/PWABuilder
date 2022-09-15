import { LitElement, css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AnalyticsBehavior, recordProcessStep, recordPWABuilderProcessStep } from '../utils/analytics';
import { getURL } from '../services/app-info';
import { generatePackage, Platform } from '../services/publish';

import {
  // smallBreakPoint,
  mediumBreakPoint,
  largeBreakPoint,
  //xLargeBreakPoint,
  xxxLargeBreakPoint,
  smallBreakPoint,
} from '../utils/css/breakpoints';

import './windows-form';
import './android-form';
import './ios-form';
import './oculus-form';
import { localeStrings } from '../../locales';
import { AppPackageFormBase } from './app-package-form-base';
import { PackageOptions } from '../utils/interfaces';

@customElement('publish-pane')
export class PublishPane extends LitElement {

  // tells page we are generating a package
  @state() generating = false;

  // Used to switch from cards to form true = cards, false = forms
  @state() cardsOrForm = true;


  // Used for google play store
  @state() isGooglePlay = true;
  @state() selectedStore = "";

  // Used to download files
  @state() readyToDownload = false;
  @state() blob: Blob | File | null | undefined;
  @state() testBlob: Blob | File | null | undefined;
  @state() downloadFileName: string | null = null;
  @state() errorMessages: TemplateResult[] = [];

  
  @state() storeMap: any = {
  "Windows": 
    {
      "logo": "/assets/windows_icon.svg",
      "packaging_text": localeStrings.text.publish.windows_platform.p,
      "package_instructions": "https://docs.pwabuilder.com/#/builder/windows"
    },
  "Android": 
    {
      "logo": "/assets/android_icon.svg"
      /* Android packaging text is handle in the function so that it will update on apk toggle */
    },
  "iOS": 
    {
      "logo": "/assets/apple_icon.svg",
      "packaging_text": "Click below for instructions for submitting to the App Store.",
      "package_instructions": "https://docs.pwabuilder.com/#/builder/app-store"
    },
  "Meta": 
    {
      "logo": "/assets/meta_icon.svg",
      "packaging_text": "Click below for packaging instructions for the Meta Quest Store.",
      "package_instructions": "https://docs.pwabuilder.com/#/builder/meta"
    }
}


  readonly platforms: ICardData[] = [
    {
      title: 'Windows',
      factoids: [
        "PWAs can be indistinguishable from native apps on Windows",
        "PWAs are first class applications.",
        "Collect 100% of revenue generated via third party commerce platforms.",
        "1B+ store enabled devices."
      ],
      isActionCard: true,
      icon: '/assets/Publish_Windows.svg',
      renderDownloadButton: () => this.renderWindowsDownloadButton()
    },
    {
      title: 'Android',
      factoids: [
        "PWAs are first class applications",
        "One app store listing for all devices (mobile, tablet, desktop)",
        "2.5 billion store enabled devices"
      ],
      isActionCard: true,
      icon: '/assets/Publish_Android.svg',
      renderDownloadButton: () => this.renderAndroidDownloadButton()
    },

    {
      title: 'iOS',
      factoids: [
        "Leverage same codebase across all platforms",
        "Large user base.",
        "Premium devices."
      ],
      isActionCard: true,
      icon: '/assets/Publish_Apple.svg',
      renderDownloadButton: () => this.renderiOSDownloadButton()
    },
    {
      title: 'Meta Quest',
      factoids: [
        "PWAs are first class applications",
        "Bring your 2D apps to VR's immersive screen",
        "Build immersive 3D experiences for VR using WebXR",
        "Currently in developer preview via sideloading"
      ],
      isActionCard: true,
      icon: '/assets/Publish_Meta.svg',
      renderDownloadButton: () => this.renderOculusDownloadButton()
    }
  ];

  static get styles() {
    return [
    css`
      * {
        box-sizing: border-box;
      }

      #pp-frame-wrapper {
        width: 100%;
        height: 90vh;
      }
      #pp-frame-content {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      #pp-frame-header {
        display: flex;
        flex-direction: column;
        row-gap: .25em;
        padding: 1em;
        padding-bottom: 0;
      }
      #pp-frame-header > * {
        margin: 0;
      }
      #pp-frame-header h1 {
        font-size: 24px;
      }
      #pp-frame-header p {
        font-size: 14px;
      }
      .card-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        box-shadow: 0px 4px 10px 4px rgba(0, 0, 0, 0.05);
        position: relative;
        padding: 1em;
      }
      .packaged-tracker {
        height: max-content;
        width: 33%;
        background-color: #E2F2E8;
        align-self: flex-end;
        justify-self: flex-end;
        border-bottom-left-radius: 5px;
        padding: 7px;
        padding-left: 9px;
        position: absolute;
        top: 0;
        right: 0;
      }
      .packaged-tracker p {
        margin: 0;
        text-align: center;
        color: #50BA87;
        font-size: 10px;
        line-height: 12px;
        font-weight: bold;
      }
      .title-block {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        width: 100%;
        row-gap: .45em;
      }
      .title-block h3 {
        margin: 0;
        font-size: 24px;
      }
      .factoids {
        width: 100%;
        height: max-content;
        padding-left: 16px;
        margin: 0;
        margin-top: 10px;
      }
      .factoids li {
        font-size: 14px;
      }
      .platform-actions-block {
        align-self: center;
        display: flex;
        justify-content: center;
        row-gap: 10px;
        width: 100%;
      }
      #store-cards {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: .75em;
        padding: 1em;
        overflow-y: auto;
      }
      app-button {
        display: flex;
        justify-content: center;
      }
      .package-button {
        all: unset;
        width: 75%;
        background-color: black;
        color: white;
        font-size: 14px;
        border-radius: 50px;
        padding: .75em 1em;
        border: none;
        text-align: center;
        font-weight: bold;
      }
      .package-button:hover {
        cursor: pointer;
        background-color: rgba(0, 0, 0, 0.75);
      }
      #apk-tabs {
        display: flex;
        align-items: baseline;
        width: 100%;
        border-bottom: 2px solid #5D5DB9;
        margin-top: 20px;
        margin-bottom: 14px;
      }
      .tab-holder {
        width: 100%;
        display: flex;
        align-items: center;
        gap: .5em;
        justify-content: center;
      }
      .tab-holder p {
        font-size: 20px;
        font-weight: 700;
        line-height: 20px;
        letter-spacing: 0px;
        text-align: center;
        margin: 0;
        padding: 10px 0;
        white-space: nowrap;
      }
      .tab-holder p:hover {
        cursor: pointer;
      }
      #other-android{
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #info-tooltip {
        height: 20px
      }
      .selected-apk {
        border-bottom: 5px solid #5D5DB9;
        color: #5D5DB9;
      }

      .unselected-apk {
        border-bottom: 5px solid transparent;
      }
      #pp-form-header {
        display: flex;
        flex-direction: column;
        background-color: #F2F3FB;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        padding: 1em;
        gap: .5em;
      }
      #pp-form-header > img {
        width: 25px;
      }
      #pp-form-header > button {
        all: unset;
      }
      #pp-form-header > button:hover {
        cursor: pointer;
      }
      #pp-form-header-content {
        display: flex;
        gap: 1em;
      }
      #pp-form-header-content img {
        height: 50px;
      }
      #pp-form-header-text {
        display: flex;
        flex-direction: column;
      }
      #pp-form-header-text > * {
        margin: 0;
      }
      #pp-form-header-text h1 {
        font-size: 24px;
        white-space: nowrap;
        line-height: 24px;
      }
      #pp-form-header-text p {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.5)
      }

      windows-form, android-form, ios-form, oculus-form {
        height: 100%;
      }

      #form-area {
        height: 100%;
        width: 100%;
        overflow: auto;
        position: relative;
      }

      #form-area[data-store="Android"] {
        padding-top: 0;
        flex-direction: column;
      }

      .dialog::part(body){
        padding: 0;
        width: 100%;
      }
      .dialog::part(title){
        display: none;
      }
      .dialog::part(panel) {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .dialog::part(overlay){
        backdrop-filter: blur(10px);
      }
      .dialog::part(close-button__base){
        position: absolute;
        top: 5px;
        right: 5px;
      }

      #unsigned-tooltip{
        position: relative;
      }

      .toolTip {
        visibility: hidden;
        font-size: 14px;
        width: 150px;
        background: black;
        color: white;
        font-weight: 500;
        text-align: center;
        border-radius: 6px;
        padding: .75em;
        /* Position the tooltip */
        position: absolute;
        top: 25px;
        left: -100px;
        z-index: 1;
        box-shadow: 0px 2px 20px 0px #0000006c;
      }
      #unsigned-tooltip:hover .toolTip {
        visibility: visible;
      }

      #errors {
        position: absolute;
        bottom: .5em;
      }

      .error-holder {
        display: flex;
        gap: .5em;
        align-items: flex-start;
        background-color: #FAEDF1;
        padding: .5em;
        border-left: 4px solid #EB5757;
        border-radius: 3px;
        margin: 0 1em;
      }

      .error-holder p {
        margin: 0;
        font-size: 14px;
      }

      .error-title {
        font-weight: bold;
      }

      .error-actions {
        display: flex;
        align-items: center;
        gap: 1em;
        margin-top: .25em;
      }

      .error-actions > * {
        all: unset;
        color: black;
        font-weight: bold;
        font-size: 14px;
        border-bottom: 1px solid transparent;
      }

      .error-actions > *:hover {
        cursor: pointer;
        border-bottom: 1px solid black;
      }

      .close_error:hover {
        cursor: pointer;
      }

      #form-extras {
        display: flex;
        justify-content: space-between;
        padding: 1em 1.5em;
        background-color: #F2F3FB;
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
      }

      #form-details-block {
        width: 50%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      #form-details-block p {
        font-size: 14px;
        color: #808080;
      }

      #form-options-actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: .5em;
      }

      #generate-submit::part(base) {
        background-color: black;
        color: white;
        height: 3em;
        width: 100%;
        border-radius: 50px;
      }

      #form-extras sl-button::part(label){
        font-size: 16px;
        padding: .5em 2em;
        display: flex;
        align-items: center;
      }

      .arrow_link {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        font-weight: bold;
        margin-bottom: .25em;
        font-size: 14px;
      }
      .arrow_link a {
        text-decoration: none;
        border-bottom: 1px solid rgb(79, 63, 182);
        font-size: 1em;
        font-weight: bold;
        margin: 0px 0.5em 0px 0px;
        line-height: 1em;
        color: rgb(79, 63, 182);
      }
      .arrow_link a:visited {
        color: #4F3FB6;
      }
      .arrow_link:hover {
        cursor: pointer;
      }
      .arrow_link:hover img {
        animation: bounce 1s;
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
        }
        40% {
          transform: translateX(-5px);
        }
        60% {
            transform: translateX(5px);
        }
      }

      #tou-link{
        color: 757575;
        font-size: 14px;
      }

      @media(max-width: 640px){
        #form-extras {
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1em;
        }
        #form-details-block {
          flex-direction: column;
          gap: .75em;
          align-items: center;
          text-align: center;
          width: 100%;
        }
        #form-options-actions {
          flex-direction: column;
        }
      }

      @media(min-height: 900px){
        #pp-frame-wrapper {
          width: 100%;
          height: 80vh;
        }
      }

      /* > 1920 */
      ${xxxLargeBreakPoint(css``)}

      /* 640px - 1023px */
      ${largeBreakPoint(css``)}

      /* 480px - 639px */
      ${mediumBreakPoint(css`
        #store-cards {
          display: flex;
          flex-direction: column;
          row-gap: .5em;
          overflow-y: auto;
        }
      `)}
      /* < 480 */
      ${smallBreakPoint(css`
        #store-cards {
          display: flex;
          flex-direction: column;
          row-gap: .5em;
          overflow-y: auto;
        }
        #pp-frame-header{
          margin-bottom: 10px;
          padding: 1em 2em 0em 1em;
        }
        #pp-frame-header h1 {
          font-size: 20px;
          line-height: 20px;
        }
        #pp-frame-header p {
          font-size: 12px;
        }
        #pp-form-header-content img {
          height: 35px;
        }
        #pp-form-header-text h1 {
          font-size: 20px;
          white-space: nowrap;
          line-height: 20px;
        }
        #pp-form-header-text p {
          font-size: 12px;
        }
        #apk-type p {
          font-size: 16px;
        }

        #info-tooltip {
          height: 16px
        }

      `)}
    `
    ];
  }

  constructor() {
    super();
  }

  firstUpdated(){

  }

  renderWindowsDownloadButton(): TemplateResult {
    return html`
      <button class="package-button" id="windows-package-button" @click="${() => this.showWindowsOptions()}">
        Generate Package
      </button>
    `;
  }

  renderAndroidDownloadButton(): TemplateResult {
    return html`
      <button class="package-button" id="android-package-button" @click="${() => this.showAndroidOptions()}">
        Generate Package
      </button>
    `;
  }

  renderiOSDownloadButton(): TemplateResult {
    return html`
      <button class="package-button" id="ios-package-button" @click="${() => this.showiOSOptions()}">
        Generate Package
      </button>
    `;
  }

  renderOculusDownloadButton(): TemplateResult {
    return html`
      <button class="package-button" id="oculus-package-button" @click="${() => this.showMetaOptions()}">
        Generate Package
      </button>
    `;
  }

  renderForm(){
    if(this.selectedStore === "Windows"){
      return html`<windows-form id="packaging-form" .generating=${this.generating}></windows-form>`
    } else if(this.selectedStore === "Android"){
      return html`
      <div id="apk-tabs">
        <div class="tab-holder selected-apk">
          <p class="apk-type" @click=${(e: any) => this.toggleApkType(e)}>Google Play</p>
        </div>
        <div class="tab-holder unselected-apk">
          <p class="apk-type" id="other-android" @click=${(e: any) => this.toggleApkType(e)}>Other Android</p>
          <div id="unsigned-tooltip">
            <img src="/assets/new/tooltip.svg" alt="info circle tooltip" />
            <span class="toolTip">
              Generates an unsigned APK.
            </span>
          </div>
        </div>
      </div>
      ${this.isGooglePlay ?
        html`<android-form id="packaging-form" .generating=${this.generating} .isGooglePlayApk=${this.isGooglePlay}></android-form>` :
        html`<android-form id="packaging-form" .generating=${this.generating} .isGooglePlayApk=${this.isGooglePlay}></android-form>`
      }`
    } else if(this.selectedStore === "Meta"){
      return html`<oculus-form id="packaging-form" .generating=${this.generating}>
      </oculus-form>`
    } else {
      return html`<ios-form id="packaging-form" .generating=${this.generating}></ios-form>`
    }

  }

  showWindowsOptions() {
    recordPWABuilderProcessStep("windows_store_form_opened", AnalyticsBehavior.ProcessCheckpoint)
    this.selectedStore = "Windows";
    this.cardsOrForm = false;
    this.requestUpdate();
  }

  showAndroidOptions() {
    recordPWABuilderProcessStep("android_store_form_opened", AnalyticsBehavior.ProcessCheckpoint);
    this.selectedStore = "Android";
    this.cardsOrForm = false;
    this.requestUpdate();
  }

  toggleApkType(event: any){
    let old = this.shadowRoot!.querySelector(".selected-apk");
    old?.classList.replace("selected-apk", "unselected-apk");
    let next = event.target.parentNode;
    next.classList.replace("unselected-apk", "selected-apk");

    if(event.target.innerHTML === "Google Play"){
      this.isGooglePlay = true;
    } else {
      this.isGooglePlay = false;
    }
  }

  showiOSOptions() {
    recordPWABuilderProcessStep("ios_store_form_opened", AnalyticsBehavior.ProcessCheckpoint);
    this.selectedStore = "iOS";
    this.cardsOrForm = false;
    this.requestUpdate();
  }

  showMetaOptions() {
    recordPWABuilderProcessStep("meta_store_form_opened", AnalyticsBehavior.ProcessCheckpoint);
    this.selectedStore = "Meta";
    this.cardsOrForm = false;
    this.requestUpdate();
  }

  async generate(platform: Platform, options?: PackageOptions) {
    // Record analysis results to our analytics portal.
    recordProcessStep(
      'analyze-and-package-pwa',
      `create-${platform}-package`,
      AnalyticsBehavior.CompleteProcess,
      { url: getURL() });

      recordProcessStep(
        'pwa-builder',
        `create-${platform}-package`,
        AnalyticsBehavior.CompleteProcess,
        { url: getURL() });

    try {
      this.generating = true;
      const packageData = await generatePackage(platform, options);

      if (packageData) {
        this.downloadFileName = `${packageData.appName}.zip`;
        if (packageData.type === 'test') {
          this.testBlob = packageData.blob;
        } else {
          this.blob = packageData.blob;
          this.readyToDownload = true;
          this.downloadPackage()
        }
      }
    } catch (err: any) {
      console.error(err);
      this.renderErrorMessage(err.response);
      //this.showAlertModal(err as Error, platform);
      recordProcessStep(
        'analyze-and-package-pwa',
        `create-${platform}-package-failed`,
        AnalyticsBehavior.CancelProcess,
        {
          url: getURL(),
          error: err
        });
        recordProcessStep(
          'pwa-builder',
          `create-${platform}-package-failed`,
          AnalyticsBehavior.CancelProcess,
          {
            url: getURL(),
            error: err
          });
    } finally {
      this.generating = false;
    }
  }

  renderErrorMessage(response: any){
    let stack_trace = "";
    let message = "";
    if(this.selectedStore === "Android"){
      message = response.stack_trace.split("stack:")[0];
      stack_trace = response.stack_trace.split("stack:")[1];
    }
    let error = html`
      <div class="error-holder">
        <img src="/assets/new/stop.svg" alt="invalid result icon" />
        <div class="error-info">
          <p class="error-title">${response.statusText}</p>
          <p class="error-desc">Status code: ${response.status}. ${message}</p>
          <div class="error-actions">
            <button class="copy_stack" @click=${() => this.copyText(stack_trace)}>Copy stack trace</button>
            <a href="https://docs.pwabuilder.com/#/builder/faq" target="_blank" rel="noopener">Visit FAQ</a>
          </div>
        </div>
        <img @click=${() => this.errorMessages = []} class="close_error" src="assets/images/Close_desk.png" alt="close icon"/>
      </div>
    `
    this.errorMessages.push(error);
  }

  copyText(text: string){
    navigator.clipboard.writeText(text);
  }

  async downloadPackage(){
    let blob = (this.blob || this.testBlob);
    if (blob) {
      let filename = this.downloadFileName || 'your_pwa.zip';
      var element = document.createElement('a');
      element.href = URL.createObjectURL(blob!)
      element.setAttribute('download', filename);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);

      this.blob = undefined;
      this.testBlob = undefined;
    }
  }

  renderContentCards(): TemplateResult[] {
    return this.platforms.map(
      platform => html`
        <div class="card-wrapper">
          ${true ? html`` :
            html`
            <div class="packaged-tracker"> <!-- This will eventually be in an "if packaged previously" -->
            <p>Packaged Previously</p>
            </div>`
          }
          <div class="title-block">
            <img class="platform-icon" src="${platform.icon}" alt="platform icon" />
            <h3>${platform.title}</h3>
            <!-- TODO need to fix the platform action blocks text spacing for the left. -->
            <div class="platform-actions-block">
              ${platform.renderDownloadButton()}
            </div>
            <ul class="factoids">
              ${platform.factoids.map((fact: string) => html`<li>${fact}</li>`)}
            </ul>
          </div>
        </div>`
    );
  }

  async hideDialog(e: any){
    let dialog: any = this.shadowRoot!.querySelector(".dialog");
    if(e.target === dialog){
      await dialog!.hide();
      recordPWABuilderProcessStep("publish_pane_closed", AnalyticsBehavior.ProcessCheckpoint);
      document.body.style.height = "unset";
    }
  }

  backToCards(){
    this.cardsOrForm = !this.cardsOrForm;
    this.errorMessages = [];
    recordPWABuilderProcessStep(`left_${this.selectedStore}_form`, AnalyticsBehavior.ProcessCheckpoint);
  }

  renderFormFooter(){
    // Special case for Android since we have to toggle some info due to the "Other Android" scenario
    if(this.selectedStore === "Android"){
      return html`
        <div id="form-extras">
          <div id="form-details-block">
            <p>${this.isGooglePlay ? localeStrings.text.android.description.form_details : "Click below for packaging instructions"}</p>
            <div class="arrow_link">
              <a @click=${() => recordPWABuilderProcessStep(`${this.isGooglePlay ? this.selectedStore.toLowerCase() : `other_${this.selectedStore.toLowerCase()}` }_packaging_instructions_clicked`, AnalyticsBehavior.ProcessCheckpoint)} href=${this.isGooglePlay ? "https://docs.pwabuilder.com/#/builder/android" : "https://docs.pwabuilder.com/#/builder/other-android"} target="_blank" rel="noopener">Packaging Instructions</a>
              <img src="/assets/new/arrow.svg" alt="arrow" role="presentation"/>
            </div>
          </div>
          <div id="form-options-actions" class="modal-actions">
            <sl-button  id="generate-submit" type="submit" @click=${() => this.submitForm()} ?loading="${this.generating}" >
              Download Package
            </sl-button>
            <a 
              target="_blank" 
              rel="noopener" 
              href="https://github.com/pwa-builder/PWABuilder/blob/master/TERMS_OF_USE.md" 
              id="tou-link"
              @click=${() => recordPWABuilderProcessStep("TOU_clicked", AnalyticsBehavior.ProcessCheckpoint)}
              >Terms of Use</a>
          </div>
        </div>
    `
    }
    return html`
      <div id="form-extras">
        <div id="form-details-block">
          <p>${this.storeMap[this.selectedStore].packaging_text}</p>
          <div class="arrow_link">
            <a @click=${() => recordPWABuilderProcessStep(`${this.selectedStore.toLowerCase()}_packaging_instructions_clicked`, AnalyticsBehavior.ProcessCheckpoint)} href=${this.storeMap[this.selectedStore].package_instructions} target="_blank" rel="noopener">Packaging Instructions</a>
            <img src="/assets/new/arrow.svg" alt="arrow" role="presentation"/>
          </div>
        </div>
        <div id="form-options-actions" class="modal-actions">
          <sl-button  id="generate-submit" type="submit" @click=${() => this.submitForm()} ?loading="${this.generating}" >
            Download Package
          </sl-button>
          <a 
            target="_blank" 
            rel="noopener" 
            href="https://github.com/pwa-builder/PWABuilder/blob/master/TERMS_OF_USE.md" 
            id="tou-link"
            @click=${() => recordPWABuilderProcessStep("TOU_clicked", AnalyticsBehavior.ProcessCheckpoint)}
            >Terms of Use</a>
        </div>
      </div>
    `
  }

  submitForm(){
    let platForm = (this.shadowRoot!.getElementById("packaging-form") as AppPackageFormBase); // windows-form | android-form | ios-form | oculus-form
    let form = platForm.getForm(); // the actual form element inside the platform form.
    
    if(form!.checkValidity()){
      let packagingOptions = platForm!.getPackageOptions();
      this.generate(this.selectedStore.toLowerCase() as Platform, packagingOptions);
    } else {
      form!.reportValidity();
    }
  }

  render() {
    return html`
      <sl-dialog class="dialog" @sl-show=${() => document.body.style.height = "100vh"} @sl-hide=${(e: any) => this.hideDialog(e)} noHeader>
        <div id="pp-frame-wrapper">
          <div id="pp-frame-content">
          ${this.cardsOrForm ?
            html`
              <div id="pp-frame-header">
                <h1>Awesome! Your PWA is store ready!</h1>
                <p>You are now ready to ship your PWA to the app stores. Generate store-ready packages for the Microsoft Store, Google Play, iOS and Meta stores.</p>
              </div>
              <div id="store-cards">
                ${this.renderContentCards()}
              </div>
            `
            :
            html`
              <div id="pp-form-header">
                <button type="button"><img src="/assets/new/back_for_package_form.svg" alt="back to store cards button" @click=${() => this.backToCards()} /></button>
                <div id="pp-form-header-content">
                  <img src="${this.storeMap[this.selectedStore].logo}" alt="${this.selectedStore} logo" />
                  <div id="pp-form-header-text">
                    <h1>${this.selectedStore} Package Options</h1>
                    <p>Customize your ${this.selectedStore} app below!</p>
                  </div>
                </div>
              </div>
              <div id="form-area" data-store=${this.selectedStore}>
                ${this.renderForm()}
                <div id="errors">${this.errorMessages.length > 0 ?  this.errorMessages.map((error: TemplateResult) => error) : html``}</div>
              </div>
              ${this.renderFormFooter()}
            `
          }
          </div>
        </div>
      </sl-dialog>

    `;
  }
}

interface ICardData {
  title: 'Windows' | 'Android' | 'iOS' | "Meta Quest";
  factoids: string[];
  isActionCard: boolean;
  icon: string;
  renderDownloadButton: () => TemplateResult;
}
