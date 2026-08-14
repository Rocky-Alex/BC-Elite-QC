#define FileHandle FileOpen(SourcePath + "package.json")
#define Line3 FileRead(FileHandle)
#expr Line3 = FileRead(FileHandle)
#expr Line3 = FileRead(FileHandle)
#expr FileClose(FileHandle)
#define AppVersion Copy(Line3, 15, Pos(",", Line3) - 16)

[Setup]
AppName=BC Elite QC
AppPublisher=Bizz Co Hub LLC
AppVersion={#AppVersion}
DefaultDirName=C:\BC Elite QC
DefaultGroupName=BC Elite QC
OutputDir=f:\Company Software\Builded Setups
OutputBaseFilename=BC_Elite_QC_Setup_Version_v1.5
Compression=lzma2/max
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
SetupIconFile=f:\Company Software\QC Software - Remaster\src-tauri\icons\icon.ico
WizardSmallImageFile=f:\Company Software\QC Software - Remaster\installer_logo.bmp
DisableWelcomePage=no

[Files]
Source: "f:\Company Software\QC Software - Remaster\Battery_checking\Battery_checking.exe"; DestDir: "{app}\Battery_checking"; Flags: ignoreversion
Source: "f:\Company Software\QC Software - Remaster\Battery_checking\Battery_checking.cfg"; DestDir: "{app}\Battery_checking"; Flags: ignoreversion
Source: "f:\Company Software\QC Software - Remaster\LCD_checking\LCD_checking.exe"; DestDir: "{app}\LCD_checking"; Flags: ignoreversion
Source: "f:\Company Software\QC Software - Remaster\Sound_checking\*"; DestDir: "{app}\Sound_checking"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "f:\Company Software\QC Software - Remaster\Keyboard_checking\Keyboard_checking.exe"; DestDir: "{app}\Keyboard_checking"; Flags: ignoreversion
Source: "f:\Company Software\QC Software - Remaster\cpuz\cpuz_x64.exe"; DestDir: "{app}\cpuz"; Flags: ignoreversion
Source: "f:\Company Software\QC Software - Remaster\cpuz\cpuz.ini"; DestDir: "{app}\cpuz"; Flags: ignoreversion
Source: "f:\Company Software\QC Software - Remaster\BizzCoHub QC File.bat"; DestDir: "{app}\Master Checker"; Flags: ignoreversion
Source: "f:\Company Software\QC Software - Remaster\src-tauri\target\release\app.exe"; DestName: "BizzCoHubQC.exe"; DestDir: "{app}\Master Checker"; Flags: ignoreversion
Source: "f:\Company Software\QC Software - Remaster\src-tauri\target\release\WebView2Loader.dll"; DestDir: "{app}\Master Checker"; Flags: ignoreversion
Source: "f:\Company Software\QC Software - Remaster\icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "{srcexe}"; DestDir: "{app}\Setup"; DestName: "QC_Setup.exe"; Flags: external ignoreversion
Source: "f:\Company Software\QC Software - Remaster\HDSentinel\*"; DestDir: "{app}\HDSentinel"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "f:\Company Software\QC Software - Remaster\installer_logo.bmp"; Flags: dontcopy
Source: "f:\Company Software\QC Software - Remaster\installation_bg.bmp"; Flags: dontcopy

[Tasks]
Name: "desktopicon"; Description: "Create Desktop Shortcuts"; GroupDescription: "Additional shortcuts:"
Name: "desktopicon\master"; Description: "BizzCoHub QC Software (Master Checker)"
Name: "desktopicon\battery"; Description: "Battery Checker"
Name: "desktopicon\cpuz"; Description: "CPU-Z Hardware Info"
Name: "desktopicon\hdsentinel"; Description: "Hard Disk Sentinel"
Name: "desktopicon\keyboard"; Description: "Keyboard Checker"
Name: "desktopicon\lcd"; Description: "LCD Pixel Checker"
Name: "desktopicon\sound"; Description: "Sound Output Checker"

[Icons]
Name: "{commondesktop}\BC Elite QC"; Filename: "{app}\Master Checker\BizzCoHubQC.exe"; IconFilename: "{app}\icon.ico"; WorkingDir: "{app}\Master Checker"; Comment: "Run Quality Control Diagnostics"; Tasks: desktopicon\master
Name: "{commondesktop}\Battery Checker"; Filename: "{app}\Battery_checking\Battery_checking.exe"; WorkingDir: "{app}\Battery_checking"; Tasks: desktopicon\battery
Name: "{commondesktop}\CPU-Z Hardware Info"; Filename: "{app}\cpuz\cpuz_x64.exe"; WorkingDir: "{app}\cpuz"; Tasks: desktopicon\cpuz
Name: "{commondesktop}\Hard Disk Sentinel"; Filename: "{app}\HDSentinel\HDSentinel.exe"; WorkingDir: "{app}\HDSentinel"; Tasks: desktopicon\hdsentinel
Name: "{commondesktop}\Keyboard Checker"; Filename: "{app}\Keyboard_checking\Keyboard_checking.exe"; WorkingDir: "{app}\Keyboard_checking"; Tasks: desktopicon\keyboard
Name: "{commondesktop}\LCD Pixel Checker"; Filename: "{app}\LCD_checking\LCD_checking.exe"; WorkingDir: "{app}\LCD_checking"; Tasks: desktopicon\lcd
Name: "{commondesktop}\Sound Output Checker"; Filename: "{app}\Master Checker\BizzCoHubQC.exe"; IconFilename: "{app}\icon.ico"; WorkingDir: "{app}\Master Checker"; Tasks: desktopicon\sound
Name: "{group}\Master Checker\BC Elite QC"; Filename: "{app}\Master Checker\BizzCoHubQC.exe"; IconFilename: "{app}\icon.ico"; WorkingDir: "{app}\Master Checker"
Name: "{group}\Battery_checking\Battery Checker"; Filename: "{app}\Battery_checking\Battery_checking.exe"; WorkingDir: "{app}\Battery_checking"
Name: "{group}\cpuz\CPU-Z Hardware Info"; Filename: "{app}\cpuz\cpuz_x64.exe"; WorkingDir: "{app}\cpuz"
Name: "{group}\HDSentinel\Hard Disk Sentinel"; Filename: "{app}\HDSentinel\HDSentinel.exe"; WorkingDir: "{app}\HDSentinel"
Name: "{group}\Keyboard_checking\Keyboard Checker"; Filename: "{app}\Keyboard_checking\Keyboard_checking.exe"; WorkingDir: "{app}\Keyboard_checking"
Name: "{group}\LCD_checking\LCD Pixel Checker"; Filename: "{app}\LCD_checking\LCD_checking.exe"; WorkingDir: "{app}\LCD_checking"
Name: "{group}\Sound_checking\Sound Output Checker"; Filename: "{app}\Master Checker\BizzCoHubQC.exe"; IconFilename: "{app}\icon.ico"; WorkingDir: "{app}\Master Checker"
Name: "{group}\Setup\QC Setup Update"; Filename: "{app}\Setup\QC_Setup.exe"; WorkingDir: "{app}\Setup"
Name: "{group}\Uninstaller\Uninstall QC Software Suite"; Filename: "{uninstallexe}"; WorkingDir: "{app}"

[Run]
Filename: "{app}\Master Checker\BizzCoHubQC.exe"; Description: "Launch BC Elite QC"; Flags: postinstall nowait skipifsilent; Check: ShouldLaunchQC

[Code]
var
  WelcomeBgImg: TBitmapImage;
  InnerBgImg: TBitmapImage;
  BottomPanel: TPanel;
  LeftPanelLogo: TBitmapImage;
  LeftPanelTitle: TLabel;
  LeftPanelVer: TLabel;
  FloatingCard: TPanel;
  CardTitleLabel: TLabel;
  CardDescLabel: TLabel;
  PercentLabel: TLabel;
  CustomLaunchCheckBox: TNewCheckBox;
  MyFinishedHeadingLabel: TLabel;
  MyFinishedLabel: TLabel;
  BypassPages: Boolean;
  ClearAllData: Boolean;

function ShouldLaunchQC: Boolean;
begin
  Result := CustomLaunchCheckBox.Checked;
end;

procedure WizardFormKeyDown(Sender: TObject; var Key: Word; Shift: TShiftState);
begin
  if (Key = 117) and (Shift = [ssShift]) then
  begin
    if WizardForm.CurPageID = wpWelcome then
    begin
      BypassPages := True;
      WizardForm.NextButton.OnClick(WizardForm.NextButton);
    end;
  end;
end;

function ShouldSkipPage(PageID: Integer): Boolean;
begin
  Result := False;
  if BypassPages then
  begin
    if (PageID = wpSelectDir) or 
       (PageID = wpSelectProgramGroup) or 
       (PageID = wpSelectTasks) or 
       (PageID = wpReady) then
    begin
      Result := True;
    end;
  end;
end;

procedure CurInstallProgressChanged(Progress, MaxProgress: Integer);
begin
  if MaxProgress > 0 then
  begin
    PercentLabel.Caption := Format('%d%%', [(Progress * 100) / MaxProgress]);
  end;
end;

procedure CurPageChanged(CurPageID: Integer);
var
  LabelHeight: Integer;
begin
  // Set notebook positions parented to FloatingCard
  WizardForm.InnerNotebook.Left := ScaleX(15);
  WizardForm.InnerNotebook.Width := FloatingCard.Width - ScaleX(30);
  WizardForm.InnerNotebook.Top := ScaleY(45);
  WizardForm.InnerNotebook.Height := FloatingCard.Height - ScaleY(60);

  // Force page container matching to prevent clipping
  WizardForm.WelcomePage.Width := WizardForm.OuterNotebook.Width;
  WizardForm.WelcomePage.Height := WizardForm.OuterNotebook.Height;
  WizardForm.FinishedPage.Width := WizardForm.OuterNotebook.Width;
  WizardForm.FinishedPage.Height := WizardForm.OuterNotebook.Height;

  WizardForm.SelectDirPage.Left := 0;
  WizardForm.SelectDirPage.Top := 0;
  WizardForm.SelectDirPage.Width := WizardForm.InnerNotebook.Width;
  WizardForm.SelectDirPage.Height := WizardForm.InnerNotebook.Height;

  WizardForm.SelectProgramGroupPage.Left := 0;
  WizardForm.SelectProgramGroupPage.Top := 0;
  WizardForm.SelectProgramGroupPage.Width := WizardForm.InnerNotebook.Width;
  WizardForm.SelectProgramGroupPage.Height := WizardForm.InnerNotebook.Height;

  WizardForm.SelectTasksPage.Left := 0;
  WizardForm.SelectTasksPage.Top := 0;
  WizardForm.SelectTasksPage.Width := WizardForm.InnerNotebook.Width;
  WizardForm.SelectTasksPage.Height := WizardForm.InnerNotebook.Height;

  WizardForm.ReadyPage.Left := 0;
  WizardForm.ReadyPage.Top := 0;
  WizardForm.ReadyPage.Width := WizardForm.InnerNotebook.Width;
  WizardForm.ReadyPage.Height := WizardForm.InnerNotebook.Height;

  // Reset standard button sizes and positions
  WizardForm.BackButton.Width := ScaleX(90);
  WizardForm.NextButton.Width := ScaleX(90);
  WizardForm.CancelButton.Width := ScaleX(90);
  
  WizardForm.CancelButton.Left := BottomPanel.Width - ScaleX(110);
  WizardForm.NextButton.Left := WizardForm.CancelButton.Left - WizardForm.NextButton.Width - ScaleX(10);
  WizardForm.BackButton.Left := WizardForm.NextButton.Left - WizardForm.BackButton.Width - ScaleX(10);

  // Manage visibility of FloatingCard and update card header titles
  case CurPageID of
    wpWelcome:
    begin
      FloatingCard.Visible := False;
      
      // Style Next Button as "Agree and Install"
      WizardForm.NextButton.Caption := 'Agree and Install';
      WizardForm.NextButton.Width := ScaleX(180);
      WizardForm.NextButton.Left := WizardForm.CancelButton.Left - WizardForm.NextButton.Width - ScaleX(10);
      WizardForm.BackButton.Visible := False;
      WizardForm.NextButton.Visible := True;
      WizardForm.CancelButton.Visible := True;
    end;
    wpSelectDir:
    begin
      FloatingCard.Visible := True;
      CardTitleLabel.Caption := 'Select Destination Location';
      CardDescLabel.Caption := 'Where should QC Software Suite be installed?';
      
      // Restore standard button layout
      WizardForm.NextButton.Caption := SetupMessage(msgButtonNext);
      WizardForm.BackButton.Visible := True;
      WizardForm.NextButton.Visible := True;
      WizardForm.CancelButton.Visible := True;
    end;
    wpSelectProgramGroup:
    begin
      FloatingCard.Visible := True;
      CardTitleLabel.Caption := 'Select Start Menu Folder';
      CardDescLabel.Caption := 'Where should Setup place the program''s shortcuts?';
      
      // Keep standard buttons
      WizardForm.BackButton.Visible := True;
      WizardForm.NextButton.Visible := True;
      WizardForm.CancelButton.Visible := True;
    end;
    wpSelectTasks:
    begin
      FloatingCard.Visible := True;
      CardTitleLabel.Caption := 'Select Additional Tasks';
      CardDescLabel.Caption := 'Which additional shortcuts should be created?';
      
      // Keep standard buttons
      WizardForm.BackButton.Visible := True;
      WizardForm.NextButton.Visible := True;
      WizardForm.CancelButton.Visible := True;
    end;
    wpReady:
    begin
      FloatingCard.Visible := True;
      CardTitleLabel.Caption := 'Ready to Install';
      CardDescLabel.Caption := 'Setup is now ready to begin installing QC Software Suite.';
      
      // Keep standard buttons
      WizardForm.BackButton.Visible := True;
      WizardForm.NextButton.Visible := True;
      WizardForm.CancelButton.Visible := True;
    end;
    wpPreparing, wpInstalling:
    begin
      FloatingCard.Visible := False;
      WizardForm.BackButton.Visible := False;
      WizardForm.NextButton.Visible := False;
      WizardForm.CancelButton.Visible := True;
    end;
    wpFinished:
    begin
      FloatingCard.Visible := False;
      
      // Hide Back and Cancel buttons, use NextButton as Finish button
      WizardForm.BackButton.Visible := False;
      WizardForm.CancelButton.Visible := False;
      WizardForm.NextButton.Visible := True;
      WizardForm.NextButton.Left := BottomPanel.Width - ScaleX(110);
      WizardForm.NextButton.Width := ScaleX(90);
      
      // Populate custom transparent labels with real runtime localized text
      MyFinishedHeadingLabel.Caption := WizardForm.FinishedHeadingLabel.Caption;
      MyFinishedLabel.Caption := WizardForm.FinishedLabel.Caption;
      
      // Override engine visibility force to hide default RunList checklist box
      WizardForm.RunList.Visible := False;
    end;
  else
  begin
    FloatingCard.Visible := True;
    CardTitleLabel.Caption := 'QC Software Suite Setup';
    CardDescLabel.Caption := 'Please follow the steps to configure your software.';
  end;
  end;

  // Show/Hide progress controls based on page
  if (CurPageID = wpPreparing) or (CurPageID = wpInstalling) then
  begin
    WizardForm.StatusLabel.Visible := True;
    WizardForm.FilenameLabel.Visible := True;
    WizardForm.ProgressGauge.Visible := True;
    PercentLabel.Visible := True;
  end
  else
  begin
    WizardForm.StatusLabel.Visible := False;
    WizardForm.FilenameLabel.Visible := False;
    WizardForm.ProgressGauge.Visible := False;
    PercentLabel.Visible := False;
  end;

  // Align Select Dir controls relative to page container
  if CurPageID = wpSelectDir then
  begin
    WizardForm.SelectDirLabel.Left := ScaleX(10);
    WizardForm.SelectDirLabel.Top := ScaleY(10);
    WizardForm.SelectDirLabel.Width := WizardForm.InnerNotebook.Width - ScaleX(20);
    WizardForm.SelectDirLabel.Font.Color := clWhite;
    
    LabelHeight := WizardForm.SelectDirLabel.Height;
    if LabelHeight < ScaleY(15) then LabelHeight := ScaleY(30);
    
    WizardForm.DirEdit.Left := ScaleX(10);
    WizardForm.DirEdit.Top := WizardForm.SelectDirLabel.Top + LabelHeight + ScaleY(10);
    WizardForm.DirEdit.Width := WizardForm.InnerNotebook.Width - ScaleX(110);
    WizardForm.DirEdit.Color := clWindow;
    WizardForm.DirEdit.Font.Color := clWindowText;
    
    WizardForm.DirBrowseButton.Left := WizardForm.InnerNotebook.Width - ScaleX(95);
    WizardForm.DirBrowseButton.Top := WizardForm.DirEdit.Top - ScaleY(2);
    WizardForm.DirBrowseButton.Width := ScaleX(85);
    
    WizardForm.SelectDirBrowseLabel.Left := ScaleX(10);
    WizardForm.SelectDirBrowseLabel.Top := WizardForm.DirEdit.Top + WizardForm.DirEdit.Height + ScaleY(15);
    WizardForm.SelectDirBrowseLabel.Width := WizardForm.InnerNotebook.Width - ScaleX(20);
    WizardForm.SelectDirBrowseLabel.Font.Color := $CCCCCC;
    
    WizardForm.DiskSpaceLabel.Left := ScaleX(10);
    WizardForm.DiskSpaceLabel.Top := WizardForm.InnerNotebook.Height - ScaleY(30);
    WizardForm.DiskSpaceLabel.Width := WizardForm.InnerNotebook.Width - ScaleX(20);
    WizardForm.DiskSpaceLabel.Font.Color := $AAAAAA;
  end;

  // Align Select Program Group controls relative to page container
  if CurPageID = wpSelectProgramGroup then
  begin
    WizardForm.SelectStartMenuFolderLabel.Left := ScaleX(10);
    WizardForm.SelectStartMenuFolderLabel.Top := ScaleY(10);
    WizardForm.SelectStartMenuFolderLabel.Width := WizardForm.InnerNotebook.Width - ScaleX(20);
    WizardForm.SelectStartMenuFolderLabel.Font.Color := clWhite;
    
    LabelHeight := WizardForm.SelectStartMenuFolderLabel.Height;
    if LabelHeight < ScaleY(15) then LabelHeight := ScaleY(30);
    
    WizardForm.GroupEdit.Left := ScaleX(10);
    WizardForm.GroupEdit.Top := WizardForm.SelectStartMenuFolderLabel.Top + LabelHeight + ScaleY(10);
    WizardForm.GroupEdit.Width := WizardForm.InnerNotebook.Width - ScaleX(110);
    WizardForm.GroupEdit.Color := clWindow;
    WizardForm.GroupEdit.Font.Color := clWindowText;
    
    WizardForm.GroupBrowseButton.Left := WizardForm.InnerNotebook.Width - ScaleX(95);
    WizardForm.GroupBrowseButton.Top := WizardForm.GroupEdit.Top - ScaleY(2);
    WizardForm.GroupBrowseButton.Width := ScaleX(85);
    
    WizardForm.SelectStartMenuFolderBrowseLabel.Left := ScaleX(10);
    WizardForm.SelectStartMenuFolderBrowseLabel.Top := WizardForm.GroupEdit.Top + WizardForm.GroupEdit.Height + ScaleY(15);
    WizardForm.SelectStartMenuFolderBrowseLabel.Width := WizardForm.InnerNotebook.Width - ScaleX(20);
    WizardForm.SelectStartMenuFolderBrowseLabel.Font.Color := $CCCCCC;
    
    WizardForm.NoIconsCheck.Left := ScaleX(10);
    WizardForm.NoIconsCheck.Top := WizardForm.SelectStartMenuFolderBrowseLabel.Top + WizardForm.SelectStartMenuFolderBrowseLabel.Height + ScaleY(10);
    WizardForm.NoIconsCheck.Width := WizardForm.InnerNotebook.Width - ScaleX(20);
    WizardForm.NoIconsCheck.Font.Color := clWhite;
  end;

  // Align Select Tasks controls relative to page container
  if CurPageID = wpSelectTasks then
  begin
    WizardForm.SelectTasksLabel.Left := ScaleX(10);
    WizardForm.SelectTasksLabel.Top := ScaleY(10);
    WizardForm.SelectTasksLabel.Width := WizardForm.InnerNotebook.Width - ScaleX(20);
    WizardForm.SelectTasksLabel.Font.Color := clWhite;
    
    LabelHeight := WizardForm.SelectTasksLabel.Height;
    if LabelHeight < ScaleY(15) then LabelHeight := ScaleY(30);
    
    WizardForm.TasksList.Left := ScaleX(10);
    WizardForm.TasksList.Top := WizardForm.SelectTasksLabel.Top + LabelHeight + ScaleY(10);
    WizardForm.TasksList.Width := WizardForm.InnerNotebook.Width - ScaleX(20);
    WizardForm.TasksList.Height := WizardForm.InnerNotebook.Height - WizardForm.TasksList.Top - ScaleY(10);
    WizardForm.TasksList.Color := $2D2D2D;
    WizardForm.TasksList.Font.Color := clWhite;
  end;

  // Align Ready controls relative to page container
  if CurPageID = wpReady then
  begin
    WizardForm.ReadyLabel.Left := ScaleX(10);
    WizardForm.ReadyLabel.Top := ScaleY(10);
    WizardForm.ReadyLabel.Width := WizardForm.InnerNotebook.Width - ScaleX(20);
    WizardForm.ReadyLabel.Font.Color := clWhite;
    
    LabelHeight := WizardForm.ReadyLabel.Height;
    if LabelHeight < ScaleY(15) then LabelHeight := ScaleY(30);
    
    WizardForm.ReadyMemo.Left := ScaleX(10);
    WizardForm.ReadyMemo.Top := WizardForm.ReadyLabel.Top + LabelHeight + ScaleY(10);
    WizardForm.ReadyMemo.Width := WizardForm.InnerNotebook.Width - ScaleX(20);
    WizardForm.ReadyMemo.Height := WizardForm.InnerNotebook.Height - WizardForm.ReadyMemo.Top - ScaleY(10);
    WizardForm.ReadyMemo.Color := $2D2D2D;
    WizardForm.ReadyMemo.Font.Color := clWhite;
  end;

  // Bring buttons to front to ensure they are on top of BottomPanel
  WizardForm.BackButton.BringToFront;
  WizardForm.NextButton.BringToFront;
  WizardForm.CancelButton.BringToFront;
end;

procedure InitializeWizard;
begin
  // Set window size to match modern gaming launchers (680x480)
  WizardForm.ClientWidth := ScaleX(680);
  WizardForm.ClientHeight := ScaleY(480);
  
  WizardForm.Color := $111625; // Dark Navy background for the base form
  WizardForm.WelcomePage.Color := $111625;
  WizardForm.InnerPage.Color := $111625;
  WizardForm.SelectDirPage.Color := $111625;
  WizardForm.SelectProgramGroupPage.Color := $111625;
  WizardForm.SelectTasksPage.Color := $111625;
  WizardForm.ReadyPage.Color := $111625;
  WizardForm.InstallingPage.Color := $111625;
  WizardForm.FinishedPage.Color := clWhite;
  
  WizardForm.Bevel.Visible := False;
  WizardForm.Bevel1.Visible := False;
  WizardForm.MainPanel.Height := 0;
  
  WizardForm.OuterNotebook.Left := 0;
  WizardForm.OuterNotebook.Top := 0;
  WizardForm.OuterNotebook.Width := WizardForm.ClientWidth;
  WizardForm.OuterNotebook.Height := ScaleY(380);

  ExtractTemporaryFile('installation_bg.bmp');

  // Welcome page background image
  WelcomeBgImg := TBitmapImage.Create(WizardForm);
  WelcomeBgImg.Parent := WizardForm.WelcomePage;
  WelcomeBgImg.Bitmap.LoadFromFile(ExpandConstant('{tmp}\installation_bg.bmp'));
  WelcomeBgImg.Left := 0;
  WelcomeBgImg.Top := 0;
  WelcomeBgImg.Width := WizardForm.ClientWidth;
  WelcomeBgImg.Height := ScaleY(380);
  WelcomeBgImg.Stretch := True;
  WelcomeBgImg.SendToBack;
  
  // Inner page background image
  InnerBgImg := TBitmapImage.Create(WizardForm);
  InnerBgImg.Parent := WizardForm.InnerPage;
  InnerBgImg.Bitmap.LoadFromFile(ExpandConstant('{tmp}\installation_bg.bmp'));
  InnerBgImg.Left := 0;
  InnerBgImg.Top := 0;
  InnerBgImg.Width := WizardForm.ClientWidth;
  InnerBgImg.Height := ScaleY(380);
  InnerBgImg.Stretch := True;
  InnerBgImg.SendToBack;
  
  // Finished page background image (none, inherits white solid color)

  // Custom Bottom Panel spanning 380px to 480px
  BottomPanel := TPanel.Create(WizardForm);
  BottomPanel.Parent := WizardForm;
  BottomPanel.Left := 0;
  BottomPanel.Top := ScaleY(380);
  BottomPanel.Width := WizardForm.ClientWidth;
  BottomPanel.Height := ScaleY(100);
  BottomPanel.ParentBackground := False;
  BottomPanel.Color := $111625;
  BottomPanel.BevelOuter := bvNone;
  BottomPanel.BevelInner := bvNone;

  // Copy-Friendly Logo on Bottom Left Panel
  LeftPanelLogo := TBitmapImage.Create(WizardForm);
  LeftPanelLogo.Parent := BottomPanel;
  ExtractTemporaryFile('installer_logo.bmp');
  LeftPanelLogo.Bitmap.LoadFromFile(ExpandConstant('{tmp}\installer_logo.bmp'));
  LeftPanelLogo.Left := ScaleX(15);
  LeftPanelLogo.Top := ScaleY(25);
  LeftPanelLogo.Width := ScaleX(50);
  LeftPanelLogo.Height := ScaleY(50);
  LeftPanelLogo.Stretch := True;

  // Branding labels on Bottom Left Panel
  LeftPanelTitle := TLabel.Create(WizardForm);
  LeftPanelTitle.Parent := BottomPanel;
  LeftPanelTitle.Left := ScaleX(75);
  LeftPanelTitle.Top := ScaleY(28);
  LeftPanelTitle.Caption := 'QC Software Suite';
  LeftPanelTitle.Font.Name := 'Segoe UI';
  LeftPanelTitle.Font.Size := 11;
  LeftPanelTitle.Font.Style := [fsBold];
  LeftPanelTitle.Font.Color := clWhite;
  LeftPanelTitle.Transparent := True;
  
  LeftPanelVer := TLabel.Create(WizardForm);
  LeftPanelVer.Parent := BottomPanel;
  LeftPanelVer.Left := ScaleX(75);
  LeftPanelVer.Top := ScaleY(52);
  LeftPanelVer.Caption := 'Version {#AppVersion}';
  LeftPanelVer.Font.Name := 'Segoe UI';
  LeftPanelVer.Font.Size := 8;
  LeftPanelVer.Font.Color := $888888;
  LeftPanelVer.Transparent := True;

  // Custom Floating Card for settings pages parented to InnerPage (above background)
  FloatingCard := TPanel.Create(WizardForm);
  FloatingCard.Parent := WizardForm.InnerPage;
  FloatingCard.Left := ScaleX(40);
  FloatingCard.Top := ScaleY(40);
  FloatingCard.Width := WizardForm.ClientWidth - ScaleX(80);
  FloatingCard.Height := ScaleY(300);
  FloatingCard.Color := $1E1E1E;
  FloatingCard.ParentBackground := False;
  FloatingCard.BevelOuter := bvNone;
  FloatingCard.BevelInner := bvNone;

  // Floating Card Header Title Label
  CardTitleLabel := TLabel.Create(WizardForm);
  CardTitleLabel.Parent := FloatingCard;
  CardTitleLabel.Left := ScaleX(15);
  CardTitleLabel.Top := ScaleY(12);
  CardTitleLabel.Font.Name := 'Segoe UI';
  CardTitleLabel.Font.Size := 11;
  CardTitleLabel.Font.Style := [fsBold];
  CardTitleLabel.Font.Color := clWhite;
  CardTitleLabel.Transparent := True;
  
  CardDescLabel := TLabel.Create(WizardForm);
  CardDescLabel.Parent := FloatingCard;
  CardDescLabel.Left := ScaleX(15);
  CardDescLabel.Top := ScaleY(28);
  CardDescLabel.Font.Name := 'Segoe UI';
  CardDescLabel.Font.Size := 8;
  CardDescLabel.Font.Color := clWhite;
  CardDescLabel.Transparent := True;

  // Parent Standard inner notebook and controls to the FloatingCard
  WizardForm.InnerNotebook.Parent := FloatingCard;
  
  // Apply Anchoring constraints so controls stretch automatically with the page container
  WizardForm.TasksList.Anchors := [akLeft, akTop, akRight, akBottom];
  WizardForm.ReadyMemo.Anchors := [akLeft, akTop, akRight, akBottom];

  // Re-parent bottom buttons to BottomPanel for modern visual alignment
  WizardForm.BackButton.Parent := BottomPanel;
  WizardForm.NextButton.Parent := BottomPanel;
  WizardForm.CancelButton.Parent := BottomPanel;

  // Align buttons on BottomPanel
  WizardForm.CancelButton.Left := BottomPanel.Width - ScaleX(110);
  WizardForm.CancelButton.Top := ScaleY(35);
  WizardForm.CancelButton.Width := ScaleX(90);
  WizardForm.CancelButton.Height := ScaleY(30);

  WizardForm.NextButton.Left := WizardForm.CancelButton.Left - ScaleX(100);
  WizardForm.NextButton.Top := ScaleY(35);
  WizardForm.NextButton.Width := ScaleX(90);
  WizardForm.NextButton.Height := ScaleY(30);

  WizardForm.BackButton.Left := WizardForm.NextButton.Left - ScaleX(100);
  WizardForm.BackButton.Top := ScaleY(35);
  WizardForm.BackButton.Width := ScaleX(90);
  WizardForm.BackButton.Height := ScaleY(30);

  // Parent installation progress controls directly to BottomPanel
  WizardForm.StatusLabel.Parent := BottomPanel;
  WizardForm.StatusLabel.Left := ScaleX(230);
  WizardForm.StatusLabel.Top := ScaleY(15);
  WizardForm.StatusLabel.Width := WizardForm.CancelButton.Left - ScaleX(10) - WizardForm.StatusLabel.Left;
  WizardForm.StatusLabel.Font.Color := clWhite;

  WizardForm.FilenameLabel.Parent := BottomPanel;
  WizardForm.FilenameLabel.Left := ScaleX(230);
  WizardForm.FilenameLabel.Top := ScaleY(65);
  WizardForm.FilenameLabel.Width := WizardForm.CancelButton.Left - ScaleX(10) - WizardForm.FilenameLabel.Left;
  WizardForm.FilenameLabel.Font.Color := $CCCCCC;

  WizardForm.ProgressGauge.Parent := BottomPanel;
  WizardForm.ProgressGauge.Left := ScaleX(230);
  WizardForm.ProgressGauge.Top := ScaleY(40);
  WizardForm.ProgressGauge.Width := WizardForm.CancelButton.Left - ScaleX(10) - WizardForm.ProgressGauge.Left;

  // Custom installation progress percentage label
  PercentLabel := TLabel.Create(WizardForm);
  PercentLabel.Parent := BottomPanel;
  PercentLabel.Left := WizardForm.CancelButton.Left - ScaleX(60);
  PercentLabel.Top := ScaleY(15);
  PercentLabel.Font.Name := 'Segoe UI';
  PercentLabel.Font.Size := 9;
  PercentLabel.Font.Style := [fsBold];
  PercentLabel.Font.Color := clWhite;
  PercentLabel.Alignment := taRightJustify;
  PercentLabel.Caption := '0%';

  // Hide Inno Setup default full page illustrations
  WizardForm.WizardBitmapImage.Visible := False;
  WizardForm.WizardBitmapImage2.Visible := False;
  WizardForm.WizardSmallBitmapImage.Visible := False;

  // Hide Inno Setup default welcome/finished labels which draw with default opaque container colors
  WizardForm.WelcomeLabel1.Visible := False;
  WizardForm.WelcomeLabel2.Visible := False;
  WizardForm.FinishedHeadingLabel.Visible := False;
  WizardForm.FinishedLabel.Visible := False;

  // Create custom transparent Finished Page labels
  MyFinishedHeadingLabel := TLabel.Create(WizardForm);
  MyFinishedHeadingLabel.Parent := WizardForm.FinishedPage;
  MyFinishedHeadingLabel.AutoSize := False;
  MyFinishedHeadingLabel.Alignment := taCenter;
  MyFinishedHeadingLabel.Left := ScaleX(20);
  MyFinishedHeadingLabel.Top := ScaleY(85);
  MyFinishedHeadingLabel.Width := WizardForm.OuterNotebook.Width - ScaleX(40);
  MyFinishedHeadingLabel.Height := ScaleY(50);
  MyFinishedHeadingLabel.Font.Name := 'Segoe UI';
  MyFinishedHeadingLabel.Font.Size := 16;
  MyFinishedHeadingLabel.Font.Style := [fsBold];
  MyFinishedHeadingLabel.Font.Color := clBlack;
  MyFinishedHeadingLabel.Transparent := True;
  
  MyFinishedLabel := TLabel.Create(WizardForm);
  MyFinishedLabel.Parent := WizardForm.FinishedPage;
  MyFinishedLabel.AutoSize := False;
  MyFinishedLabel.Alignment := taCenter;
  MyFinishedLabel.Left := ScaleX(20);
  MyFinishedLabel.Top := ScaleY(145);
  MyFinishedLabel.Width := WizardForm.OuterNotebook.Width - ScaleX(40);
  MyFinishedLabel.Height := ScaleY(90);
  MyFinishedLabel.Font.Name := 'Segoe UI';
  MyFinishedLabel.Font.Size := 10;
  MyFinishedLabel.Font.Style := [fsBold];
  MyFinishedLabel.Font.Color := clBlack;
  MyFinishedLabel.WordWrap := True;
  MyFinishedLabel.Transparent := True;

  // Hide default checklist box and replace with custom transparent checkbox
  WizardForm.RunList.Visible := False;
  
  CustomLaunchCheckBox := TNewCheckBox.Create(WizardForm);
  CustomLaunchCheckBox.Parent := WizardForm.FinishedPage;
  CustomLaunchCheckBox.Left := ScaleX(180);
  CustomLaunchCheckBox.Top := ScaleY(250);
  CustomLaunchCheckBox.Width := ScaleX(320);
  CustomLaunchCheckBox.Height := ScaleY(30);
  CustomLaunchCheckBox.Caption := 'Launch BC Elite QC';
  CustomLaunchCheckBox.Font.Name := 'Segoe UI';
  CustomLaunchCheckBox.Font.Size := 9;
  CustomLaunchCheckBox.Font.Style := [fsBold];
  CustomLaunchCheckBox.Font.Color := clBlack;
  CustomLaunchCheckBox.Checked := True;

  BypassPages := False;
  WizardForm.KeyPreview := True;
  WizardForm.OnKeyDown := @WizardFormKeyDown;
end;

function InitializeUninstall: Boolean;
var
  ResultCode: Integer;
begin
  // Force terminate any running processes of the diagnostics suite
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/f /im BizzCoHubQC.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/f /im Battery_checking.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/f /im LCD_checking.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/f /im Keyboard_checking.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/f /im cpuz_x64.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/f /im HDSentinel.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  Result := True;
  ClearAllData := MsgBox('Do you want to clear all QC diagnostic database, logs history, and custom settings?', mbConfirmation, MB_YESNO) = idYes;
end;

procedure CurUninstallStepChanged(UninstallStep: TUninstallStep);
var
  LocalAppFolder: String;
  AppFolder: String;
begin
  if (UninstallStep = usPostUninstall) and ClearAllData then
  begin
    // 1. Delete WebView2 Cache & LocalStorage folder
    LocalAppFolder := ExpandConstant('{localappdata}\com.bcelite.qc');
    if DirExists(LocalAppFolder) then
    begin
      DelTree(LocalAppFolder, True, True, True);
    end;

    // 2. Delete the entire installation folder and any residual files (e.g. HDSentinel.sta, configs, log files)
    AppFolder := ExpandConstant('{app}');
    if DirExists(AppFolder) then
    begin
      DelTree(AppFolder, True, True, True);
    end;
  end;
end;
