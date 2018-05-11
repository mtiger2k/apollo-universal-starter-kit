import React from 'react';
import { View, StyleSheet, Linking, TouchableOpacity, Text, Platform } from 'react-native';
import { WebBrowser } from 'expo';
import { withApollo } from 'react-apollo';
import PropTypes from 'prop-types';
import { FontAwesome } from '@expo/vector-icons';

import { setItem } from '../../../../common/clientStorage';
import CURRENT_USER_QUERY from '../../../graphql/CurrentUserQuery.graphql';
import { withUser } from '../../../containers/Auth';
import buildRedirectUrlForMobile from '../../../helpers';
import access from '../../../access';
import {
  iconWrapper,
  linkText,
  link,
  buttonContainer,
  separator,
  btnIconContainer,
  btnTextContainer,
  btnText
} from '../../../../common/components/native/styles';

const githubLogin = () => {
  const url = buildRedirectUrlForMobile('github');
  if (Platform.OS === 'ios') {
    WebBrowser.openBrowserAsync(url);
  } else {
    Linking.openURL(url);
  }
};

const GitHubButton = withApollo(({ client, text }) => {
  return (
    <TouchableOpacity style={styles.buttonContainer} onPress={() => access.doLogin(client).then(githubLogin )}>
      <View style={styles.btnIconContainer}>
        <FontAwesome name="github-square" size={30} style={{ color: '#fff', marginLeft: 10 }} />
        <View style={styles.separator} />
      </View>
      <View style={styles.btnTextContainer}>
        <Text style={styles.btnText}>{text}</Text>
      </View>
    </TouchableOpacity>
  );
});

const GitHubLink = withApollo(({ client, text }) => {
  return (
    <TouchableOpacity onPress={() => access.doLogin(client).then(githubLogin )} style={styles.link}>
      <Text style={styles.linkText}>{text}</Text>
    </TouchableOpacity>
  );
});

const GitHubIcon = withApollo(({ client }) => {
  return (
    <View style={styles.iconWrapper}>
      <FontAwesome
        name="github-square"
        size={40}
        style={{ color: '#464646' }}
        onPress={() => access.doLogin(client).then(githubLogin )}
      />
    </View>
  );
});

class GitHubComponent extends React.Component {
  componentDidMount() {
    Linking.addEventListener('url', this.handleOpenURL);
  }

  componentWillUnmount() {
    Linking.removeListener('url');
  }

  handleOpenURL = async ({ url }) => {
    // Extract stringified user string out of the URL
    const [, data] = url.match(/data=([^#]+)/);
    const decodedData = JSON.parse(decodeURI(data));
    const { client, refetchCurrentUser } = this.props;
    if (decodedData.tokens) {
      await setItem('accessToken', decodedData.tokens.accessToken);
      await setItem('refreshToken', decodedData.tokens.refreshToken);
    }
    const result = await refetchCurrentUser();

    if (result.data && result.data.currentUser) {
      await client.writeQuery({
        query: CURRENT_USER_QUERY,
        data: result.data
      });
    }
    if (Platform.OS === 'ios') {
      WebBrowser.dismissBrowser();
    }
  };

  render() {
    const { type, text } = this.props;
    switch (type) {
      case 'button':
        return <GitHubButton text={text} />;
      case 'link':
        return <GitHubLink text={text} />;
      case 'icon':
        return <GitHubIcon />;
      default:
        return <GitHubButton text={text} />;
    }
  }
}

GitHubComponent.propTypes = {
  client: PropTypes.object,
  type: PropTypes.string,
  text: PropTypes.string.isRequired,
  refetchCurrentUser: PropTypes.func
};

const styles = StyleSheet.create({
  iconWrapper,
  linkText,
  link,
  buttonContainer: {
    ...buttonContainer,
    marginTop: 15,
    backgroundColor: '#464646'
  },
  separator,
  btnIconContainer,
  btnTextContainer,
  btnText
});

export default withUser(withApollo(GitHubComponent));