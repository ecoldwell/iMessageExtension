//
// App.iMessage.js
//

import React, { Component } from 'react';
import {
  Text,
  View,
  NativeModules,
  NativeEventEmitter,
  TouchableOpacity,
  Button,
  Image,
  StyleSheet,
  ImagePropTypes,
  TextInput,
  InputAccessoryView, 
  ScrollView,
  Platform,
  PixelRatio,
  Switch,
  Keyboard
} from 'react-native';
import PropTypes from 'prop-types';
import {AutoGrowingTextInput} from 'react-native-autogrow-textinput';
import {KeyboardAccessoryView, KeyboardUtils} from 'react-native-keyboard-input';
import {KeyboardRegistry} from 'react-native-keyboard-input';
import {_} from 'lodash';

KeyboardRegistry.registerKeyboard('KeyboardView', () => KeyboardView);
KeyboardRegistry.registerKeyboard('AnotherKeyboardView', () => AnotherKeyboardView);



import DevMenu from './DevMenu';

// import './demoKeyboards';
import CustomKeyboardView from './src/CustomKeyboardView';

const IsIOS = Platform.OS === 'ios';
const TrackInteractive = true;






// KeyboardRegistry.onItemSelected(`MyKeyboardView`, params);

const { MessagesManager, MessagesEventEmitter } = NativeModules;
const MessagesEvents = new NativeEventEmitter(MessagesEventEmitter);



export default class App extends Component {


  static propTypes = {
    title: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.keyboardAccessoryViewContent = this.keyboardAccessoryViewContent.bind(this);
    this.onKeyboardItemSelected = this.onKeyboardItemSelected.bind(this);
    this.resetKeyboardView = this.resetKeyboardView.bind(this);
    this.onKeyboardResigned = this.onKeyboardResigned.bind(this);
    this.showLastKeyboard = this.showLastKeyboard.bind(this);
    this.isCustomKeyboardOpen = this.isCustomKeyboardOpen.bind(this);


  }
  state ={
    presentationStyle: '',
    conversation: null,
    message: null,
     text: 'Placeholder Text',
     keyboardStatus: undefined,
     customKeyboard: {
      component: undefined,
      initialProps: undefined,
    },
    receivedKeyboardData: undefined,
    useSafeArea: true,
    keyboardOpenState: false,
}




  // static propTypes = {
  //   title: this.propTypes.string,
  // }
  onKeyboardItemSelected(keyboardId, params) {
    const receivedKeyboardData = `onItemSelected from "${keyboardId}"\nreceived params: ${JSON.stringify(params)}`;
    this.setState({receivedKeyboardData});
  }

  onKeyboardResigned() {
    this.setState({keyboardOpenState: false});
    this.resetKeyboardView();
  }

  componentDidMount() {
    MessagesManager
      .getPresentationStyle(presentationStyle => this.setState({ presentationStyle }))

    MessagesEvents
      .addListener('onPresentationStyleChanged', ({ presentationStyle }) => this.setState({ presentationStyle }));

    MessagesManager
      .getActiveConversation((conversation, message) => this.setState({ conversation, message }));

    MessagesEvents
      .addListener('didReceiveMessage', ({ message }) => this.setState({ message }));

    MessagesEvents
      .addListener('didSelectMessage', ({ message }) => this.setState({ message }));

    this.performFakeAsyncTaskAndHideLoadingView()

    this.keyboardDidShowSubscription = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        this.setState({ keyboardStatus: 'Keyboard Shown' });
      },
    );
    this.keyboardDidHideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        this.setState({ keyboardStatus: 'Keyboard Hidden' });
      },
    );
    // this.keyboardWillChangeFrame = Keyboard.addListener(
    //   'keyboardWillChangeFrame',
    //   () => {
    //     this.setState({ keyboardStatus: 'Keyboard Change Frame' });
    //   },
    // );
  }

  componentWillUnmount() {
    this.keyboardDidShowSubscription.remove();
    this.keyboardDidHideSubscription.remove();
    this.keyboardWillChangeFrame.remove();
  }

  performFakeAsyncTaskAndHideLoadingView = () => {
    setTimeout(() => MessagesManager.hideLoadingView(), 1500);
  }

  onTogglePresentationStyle = () => {
    MessagesManager
      .updatePresentationStyle(this.state.presentationStyle === 'expanded' ? 'compact' : 'expanded')
      .then(presentationStyle => this.setState({ presentationStyle }))
  }

  onComposeMessage = () => {
    MessagesManager.composeMessage({
      layout: {
        imageName: 'zebra.jpg',
        imageTitle: 'Image Title',
        imageSubtitle: 'Image Subtitle',
      },
      summaryText: 'Sent a message from AwesomeMessageExtension',
      url: `?timestamp=${Date.now()}&sender=${this.state.conversation.localParticipiantIdentifier}`
    })
    .then(() => MessagesManager.updatePresentationStyle('compact'))
    .catch(error => console.log('An error occurred while composing the message: ', error))
  }



  getToolbarButtons() {
    return [
      {
        text: 'show1',
        testID: 'show1',
        onPress: () => this.showKeyboardView('KeyboardView', 'FIRST - 1 (passed prop)'),
      },
      {
        text: 'show2',
        testID: 'show2',
        onPress: () => this.showKeyboardView('AnotherKeyboardView', 'SECOND - 2 (passed prop)'),
      },
      {
        text: 'reset',
        testID: 'reset',
        onPress: () => this.resetKeyboardView(),
      },
    ];
  }

  resetKeyboardView() {
    this.setState({customKeyboard: {}});
  }

  showKeyboardView(component, title) {
    this.setState({
      keyboardOpenState: true,
      customKeyboard: {
        component,
        initialProps: {title},
      },
    });
  }

  dismissKeyboard() {
    KeyboardUtils.dismiss();
  }

  showLastKeyboard() {
    const {customKeyboard} = this.state;
    this.setState({customKeyboard: {}});

    setTimeout(() => {
      this.setState({
        keyboardOpenState: true,
        customKeyboard,
      });
    }, 500);
  }
  isCustomKeyboardOpen = () => {
    const {keyboardOpenState, customKeyboard} = this.state;
    return keyboardOpenState && !_.isEmpty(customKeyboard);
  }

  toggleUseSafeArea = () => {
    const {useSafeArea} = this.state;
    this.setState({useSafeArea: !useSafeArea});

    if (this.isCustomKeyboardOpen()) {
      this.dismissKeyboard();
      this.showLastKeyboard();
    }
  }

  safeAreaSwitchToggle = () => {
    if (!IsIOS) {
      return (<View />);
    }
    const {useSafeArea} = this.state;
    const styles = StyleSheet.create({
      safeAreaSwitchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      },
      switch: {
        marginLeft: 15,
      },
    });

    return (
      <View tyle={styles.safeAreaSwitchContainer}>
        <Text>Safe Area Enabled:</Text>
        <Switch style={styles.switch} value={useSafeArea} onValueChange={this.toggleUseSafeArea}/>
      </View>
    );
  }

  keyboardAccessoryViewContent() {
    const COLOR = '#F5FCFF';
    const styles = StyleSheet.create({
      keyboardContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      },
      keyboardContainer: {
        ...Platform.select({
          ios: {
            flex: 1,
            backgroundColor: COLOR,
          },
        }),
      },
      inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
      },
      textInput: {
        flex: 1,
        marginLeft: 10,
        marginTop: 10,
        marginBottom: 10,
        paddingLeft: 10,
        paddingTop: 2,
        paddingBottom: 5,
        fontSize: 16,
        backgroundColor: 'white',
        borderWidth: 0.5 / PixelRatio.get(),
        borderRadius: 18,
      },
      sendButton: {
        paddingRight: 15,
        paddingLeft: 15,
        alignSelf: 'center',
      },
    });
    return (
      <View style={styles.keyboardContainer}>
        <View style={{borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#bbb'}}/>
        <View style={styles.inputContainer}>
          <AutoGrowingTextInput
            maxHeight={200}
            style={styles.textInput}
            ref={(r) => {
              this.textInputRef = r;
            }}
            placeholder={'Message'}
            underlineColorAndroid="transparent"
            onFocus={() => this.resetKeyboardView()}
            testID={'input'}
          />
          <TouchableOpacity style={styles.sendButton} onPress={() => KeyboardUtils.dismiss()}>
            <Text>Action</Text>
          </TouchableOpacity>
        </View>
        <View style={{flexDirection: 'row'}}>
          {
            this.getToolbarButtons().map((button, index) =>
              <TouchableOpacity
                onPress={button.onPress}
                style={{paddingLeft: 15, paddingBottom: 10}}
                key={index}
                testID={button.testID}
              >
                <Text>{button.text}</Text>
              </TouchableOpacity>)
          }
        </View>
      </View>
    );
  }
  onOpenURL = () => {
    MessagesManager.openURL('url://test')
      .then(() => console.log('Successfully opened url!'))
      .catch(error => console.log('An error occurred while opening the URL: ', error))
  }

  onShowLoadingView = () => {
    MessagesManager.showLoadingView();
    this.performFakeAsyncTaskAndHideLoadingView();
  }
  

  render() {

    const { message } = this.state;
    const inputAccessoryViewID = 'inputAccessoryView1';

    const COLOR = '#F5FCFF';
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: "#007DFF",
        padding: 20,
        flexDirection: "column",
      },
      keyboardContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      },
      contentContainer: {
        flex:1,
        // alignItems:'stretch',
        // justifyContent: 'stretch',
        flexDirection: 'column',  
      },
      textInputView: {
        padding: 8,
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
      },
      textInput: {
        flexGrow: 1,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: "#CCC",
        padding: 10,
        fontSize: 16,
        marginRight: 10,
        textAlignVertical: "top",
      },
      textInputButton: {
        flexShrink: 1,
      },
      scrollContainer: {
        justifyContent: 'center',
        padding: 15,
        flex: 1,
      },
      welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
        paddingTop: 50,
        paddingBottom: 50,
      },
});


    return (
  <View style={styles.container}>
        <ScrollView
          
          keyboardDismissMode={TrackInteractive ? 'interactive' : 'none'}
        >
          { this.safeAreaSwitchToggle() }
        </ScrollView>
        
        {/* <KeyboardAccessoryView
          renderContent={this.keyboardAccessoryViewContent}
          onHeightChanged={height => this.setState({keyboardAccessoryViewHeight: IsIOS ? height : undefined})}
          trackInteractive={TrackInteractive}
          kbInputRef={this.textInputRef}
          kbComponent={this.state.customKeyboard.component}
          kbInitialProps={this.state.customKeyboard.initialProps}
          onItemSelected={this.onKeyboardItemSelected}
          onKeyboardResigned={this.onKeyboardResigned}
          revealKeyboardInteractive
          useSafeArea={this.state.useSafeArea}
        /> */}
      <ScrollView KeyboardRegistry="KeyboardView">
        <View>
        {__DEV__ && <DevMenu />}

        
        <View style={{flexDirection: 'row'}}>
 
          {
            this.getToolbarButtons().map((button, index) =>
              <TouchableOpacity
                onPress={button.onPress}
                style={{paddingLeft: 15, paddingBottom: 10, borderRadius:5}}
                key={index}
                testID={button.testID}
              >
                <Text>{button.text}</Text>
              </TouchableOpacity>)
          }
          
        </View>
        
        <View>
        <TextInput
          placeholder='Click here…'
          onSubmitEditing={Keyboard.dismiss}
        />
        <Text>
          {this.state.keyboardStatus}
        </Text>
        <TextInput
          inputAccessoryViewID={inputAccessoryViewID}
          onChangeText={(text) => this.setState({ text })}
          value={this.state.text}
        />
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={{ backgroundColor: 'white' }}>
            <Button
              onPress={() =>
                this.setState({ text: 'Placeholder Text' })
              }
              title="Reset Text"
            />
          </View>
        </InputAccessoryView>
        </View>
        <Button
          title="Toggle the Presentation Style"
          onPress={this.onTogglePresentationStyle}
          disabled={!this.state.presentationStyle}
        />
        </View>
        </ScrollView>
{/* <KeyboardInput/> */}
<ScrollView KeyboardRegistry="AnotherKeyboardView">
        <Text>TESTING CUSTOM</Text>
        <Image source={{uri: 'https://reactjs.org/logo-og.png'}}
       style={{width: 40, height: 40}} />

        <Button
          title="Toggle the Presentation Style"
          onPress={this.onTogglePresentationStyle}
          disabled={!this.state.presentationStyle}
        />

        <Button
          title="Compose Message"
          onPress={this.onComposeMessage}
        />

        <Button
          title="Open URL"
          onPress={this.onOpenURL}
        />

        <Button
          title="Show Loading View (hides after 3 seconds)"
          onPress={this.onShowLoadingView}
        />
        </ScrollView>
<ScrollView>
        {message && message.url && (
          <View style={{
            marginTop: 25,
            alignItems: 'center',
          }}>
            <Text>
              URL from the message:
            </Text>

            <Text style={{
              fontWeight: 'bold',
              paddingLeft: 24,
              paddingRight: 24,
            }}>
              {message.url}
            </Text>
          </View>
        )}
        </ScrollView>

      </View>
      
    );
  }
}


